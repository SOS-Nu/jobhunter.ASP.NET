using System.IdentityModel.Tokens.Jwt;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using JobZone.ASP.NET.DTOs.Request;
using JobZone.ASP.NET.DTOs.Response;
using JobZone.ASP.NET.Entities;
using JobZone.ASP.NET.Filters;
using JobZone.ASP.NET.Middleware;
using JobZone.ASP.NET.Services;

namespace JobZone.ASP.NET.Controllers
{
    [Route("api/v1")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IUserService _userService;
        private readonly IOtpService _otpService;
        private readonly IEmailService _emailService;
        private readonly IMapper _mapper;
        private readonly IConfiguration _config;

        public AuthController(IAuthService authService, IUserService userService, IOtpService otpService, IEmailService emailService, IMapper mapper, IConfiguration config)
        {
            _authService = authService; 
            _userService = userService; 
            _otpService = otpService;
            _emailService = emailService;
            _mapper = mapper; 
            _config = config;
        }

        [HttpPost("auth/login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] ReqLoginDTO loginDto)
        {
            var user = await _userService.GetUserByEmailAsync(loginDto.Username);
            if (user == null || user.Password == null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, user.Password))
                throw new UnauthorizedAccessException("Username/Password không hợp lệ");

            await _userService.CheckAndEnforceSessionLimitAsync(user);

            var res = new ResLoginDTO { User = _mapper.Map<UserLoginDTO>(user) };
            res.AccessToken = _authService.CreateAccessToken(user.Email, res);
            var refreshToken = _authService.CreateRefreshToken(user.Email, res);

            // Decode to get JTI and expiry
            var handler = new JwtSecurityTokenHandler();
            var decoded = handler.ReadJwtToken(refreshToken);
            var jti = decoded.Id;
            var expiresAt = decoded.ValidTo;
            await _userService.CreateSessionAsync(user, jti, expiresAt);

            SetRefreshTokenCookie(refreshToken);
            return Ok(res);
        }

        [HttpGet("auth/account")]
        [Authorize]
        [ApiMessage("fetch account")]
        public async Task<IActionResult> GetAccount()
        {
            var email = User.Identity?.Name ?? "";
            var user = await _userService.GetUserByEmailAsync(email);
            var userLogin = user != null ? _mapper.Map<UserLoginDTO>(user) : null;
            return Ok(new UserGetAccountDTO { User = userLogin });
        }

        [HttpGet("auth/refresh")]
        [AllowAnonymous]
        [ApiMessage("Get User by refresh token")]
        public async Task<IActionResult> RefreshToken()
        {
            var refreshToken = Request.Cookies["refresh_token"];
            if (string.IsNullOrEmpty(refreshToken)) throw new IdInvalidException("Bạn không có refresh token ở cookie");

            var principal = _authService.ValidateRefreshToken(refreshToken);
            if (principal == null) throw new IdInvalidException("Refresh Token không hợp lệ");

            var email = principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? principal.Identity?.Name ?? "";
            var jti = principal.FindFirst(JwtRegisteredClaimNames.Jti)?.Value ?? "";

            var session = await _userService.FindSessionByJtiAsync(jti)
                ?? throw new IdInvalidException("Refresh Token không hợp lệ (Session không tồn tại)");

            var user = await _userService.GetUserByEmailAsync(email);
            var res = new ResLoginDTO { User = user != null ? _mapper.Map<UserLoginDTO>(user) : null };
            res.AccessToken = _authService.CreateAccessToken(email, res);
            var newRefreshToken = _authService.CreateRefreshToken(email, res);

            await _userService.DeleteSessionByJtiAsync(jti);
            var handler = new JwtSecurityTokenHandler();
            var decoded = handler.ReadJwtToken(newRefreshToken);
            await _userService.CreateSessionAsync(session.User, decoded.Id, decoded.ValidTo);

            SetRefreshTokenCookie(newRefreshToken);
            return Ok(res);
        }

        [HttpPost("auth/logout")]
        [Authorize]
        [ApiMessage("Logout User")]
        public async Task<IActionResult> Logout()
        {
            var refreshToken = Request.Cookies["refresh_token"];
            if (!string.IsNullOrEmpty(refreshToken))
            {
                try
                {
                    var principal = _authService.ValidateRefreshToken(refreshToken);
                    var jti = principal?.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
                    if (!string.IsNullOrEmpty(jti)) await _userService.DeleteSessionByJtiAsync(jti);
                }
                catch { /* Ignore */ }
            }

            Response.Cookies.Delete("refresh_token", new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                Path = "/",
                SameSite = SameSiteMode.Strict
            });
            return Ok(null);
        }

        [HttpPost("auth/register")]
        [AllowAnonymous]
        [ApiMessage("Register a new user")]
        public async Task<IActionResult> Register([FromBody] ReqUserRegisterDTO registerDTO)
        {
            if (await _userService.IsEmailExistAsync(registerDTO.Email))
                throw new IdInvalidException($"Email {registerDTO.Email} đã tồn tại, vui lòng sử dụng email khác.");

            // Validate OTP
            await _otpService.ValidateOtpAsync(registerDTO.Email, registerDTO.OtpCode);

            var user = new User
            {
                Name = registerDTO.Name, Email = registerDTO.Email,
                Password = BCrypt.Net.BCrypt.HashPassword(registerDTO.Password),
                Age = registerDTO.Age, Gender = registerDTO.Gender, Address = registerDTO.Address,
                IsPublic = true,
                RoleId = 2 // DEFAULT ROLE (USER)
            };
            var newUser = await _userService.CreateUserAsync(user);
            var dto = _mapper.Map<ResCreateUserDTO>(newUser);
            return StatusCode(201, dto);
        }

        [HttpPost("auth/register/send-otp")]
        [AllowAnonymous]
        [ApiMessage("Gửi mã OTP để đăng ký tài khoản")]
        public async Task<IActionResult> SendOtpRegister([FromBody] ReqSendOtpDTO dto)
        {
            if (await _userService.IsEmailExistAsync(dto.Email))
            {
                throw new IdInvalidException($"Email {dto.Email} đã tồn tại, vui lòng sử dụng email khác.");
            }

            var otpCode = _otpService.GenerateOtp();
            await _otpService.SaveOtpAsync(dto.Email, otpCode);
            await _emailService.SendEmailAsync(dto.Email, "Mã OTP để đăng ký tài khoản", $"Mã OTP của bạn là: <b>{otpCode}</b>. Mã này có hiệu lực trong 5 phút.", true);

            return Ok(null);
        }

        [HttpPost("auth/google")]
        [AllowAnonymous]
        [ApiMessage("Google Login")]
        public async Task<IActionResult> GoogleLogin([FromBody] ReqGoogleLoginDTO dto)
        {
            var handler = new JwtSecurityTokenHandler();
            if (!handler.CanReadToken(dto.Credential))
                throw new IdInvalidException("Invalid Google Token");

            var token = handler.ReadJwtToken(dto.Credential);
            var email = token.Claims.FirstOrDefault(c => c.Type == "email")?.Value;
            var name = token.Claims.FirstOrDefault(c => c.Type == "name")?.Value ?? "Google User";

            if (string.IsNullOrEmpty(email))
                throw new IdInvalidException("Invalid Google Token");

            var user = await _userService.GetUserByEmailAsync(email);
            if (user == null)
            {
                user = new User
                {
                    Email = email,
                    Name = name,
                    Password = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()), // Random password
                    Age = 0,
                    IsPublic = true,
                    RoleId = 2 // Default ROLE_USER is usually 2, or we could handle it via RoleRef later, simple implementation here
                };
                user = await _userService.CreateUserAsync(user);
            }

            await _userService.CheckAndEnforceSessionLimitAsync(user);

            var res = new ResLoginDTO { User = _mapper.Map<UserLoginDTO>(user) };
            res.AccessToken = _authService.CreateAccessToken(user.Email, res);
            var refreshToken = _authService.CreateRefreshToken(user.Email, res);

            var decoded = handler.ReadJwtToken(refreshToken);
            await _userService.CreateSessionAsync(user, decoded.Id, decoded.ValidTo);

            SetRefreshTokenCookie(refreshToken);
            return Ok(res);
        }

        [HttpPost("auth/change-password")]
        [Authorize]
        [ApiMessage("Đổi mật khẩu")]
        public async Task<IActionResult> ChangePassword([FromBody] ReqChangePasswordDTO changePasswordDTO)
        {
            var email = User.Identity?.Name ?? throw new IdInvalidException("Không tìm thấy user");
            var user = await _userService.GetUserByEmailAsync(email);
            if (user == null) throw new IdInvalidException("User không tồn tại");

            if (user.Password != null)
            {
                if (string.IsNullOrEmpty(changePasswordDTO.OldPassword) || !BCrypt.Net.BCrypt.Verify(changePasswordDTO.OldPassword, user.Password))
                {
                    throw new IdInvalidException("Mật khẩu cũ không đúng...");
                }
            }

            var updatedUser = await _userService.SaveUserWithNewPasswordAsync(user, changePasswordDTO.NewPassword);

            // Generate new tokens to keep user logged in
            var resLogin = new ResLoginDTO { User = _mapper.Map<UserLoginDTO>(updatedUser) };
            resLogin.AccessToken = _authService.CreateAccessToken(email, resLogin);
            var newRefreshToken = _authService.CreateRefreshToken(email, resLogin);

            // Blacklist and delete OLD session
            var oldRefreshToken = Request.Cookies["refresh_token"];
            string? oldJti = null;
            if (!string.IsNullOrEmpty(oldRefreshToken))
            {
                try
                {
                    var principal = _authService.ValidateRefreshToken(oldRefreshToken);
                    oldJti = principal?.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
                    if (!string.IsNullOrEmpty(oldJti)) await _userService.DeleteSessionByJtiAsync(oldJti);
                }
                catch { /* Ignore */ }
            }

            // Create NEW session
            var handler = new JwtSecurityTokenHandler();
            var decodedNew = handler.ReadJwtToken(newRefreshToken);
            var newJti = decodedNew.Id;
            await _userService.CreateSessionAsync(updatedUser, newJti, decodedNew.ValidTo);

            SetRefreshTokenCookie(newRefreshToken);

            // Get all sessions for response
            var sessions = await _userService.GetSessionsForUserAsync(updatedUser.Id);
            var sessionDtos = sessions.Select(s => new ResSessionDTO(s, newJti)).ToList();

            return Ok(new ResChangePasswordDTO(resLogin, sessionDtos, newJti));
        }

        [HttpPost("auth/send-otp")]
        [AllowAnonymous]
        [ApiMessage("Gửi mã OTP để đổi mật khẩu")]
        public async Task<IActionResult> SendOtp([FromBody] ReqSendOtpDTO dto)
        {
            var user = await _userService.GetUserByEmailAsync(dto.Email);
            if (user == null) throw new IdInvalidException("Email không tồn tại");

            var otpCode = _otpService.GenerateOtp();
            await _otpService.SaveOtpAsync(dto.Email, otpCode);
            await _emailService.SendEmailAsync(dto.Email, "Mã OTP để đổi mật khẩu", $"Mã OTP của bạn là: <b>{otpCode}</b>. Mã này có hiệu lực trong 5 phút.", true);

            return Ok(null);
        }

        [HttpPost("auth/verify-otp-change-password")]
        [AllowAnonymous]
        [ApiMessage("Xác minh OTP và đổi mật khẩu")]
        public async Task<IActionResult> VerifyOtpAndChangePassword([FromBody] ReqVerifyOtpChangePasswordDTO dto)
        {
            await _otpService.ValidateOtpAsync(dto.Email, dto.OtpCode);
            var user = await _userService.GetUserByEmailAsync(dto.Email);
            if (user == null) throw new IdInvalidException("User không tồn tại");

            var updatedUser = await _userService.SaveUserWithNewPasswordAsync(user, dto.NewPassword);

            // Delete ALL old sessions for security after password reset
            var sessions = await _userService.GetSessionsForUserAsync(updatedUser.Id);
            foreach (var session in sessions)
            {
                await _userService.DeleteSessionByJtiAsync(session.RefreshTokenJti);
            }

            // Login immediately
            var res = new ResLoginDTO { User = _mapper.Map<UserLoginDTO>(updatedUser) };
            res.AccessToken = _authService.CreateAccessToken(updatedUser.Email, res);
            var refreshToken = _authService.CreateRefreshToken(updatedUser.Email, res);

            var handler = new JwtSecurityTokenHandler();
            var decoded = handler.ReadJwtToken(refreshToken);
            await _userService.CreateSessionAsync(updatedUser, decoded.Id, decoded.ValidTo);

            SetRefreshTokenCookie(refreshToken);
            return Ok(res);
        }

        [HttpGet("auth/sessions")]
        [Authorize]
        [ApiMessage("Lấy danh sách các thiết bị đang đăng nhập")]
        public async Task<IActionResult> GetActiveSessions()
        {
            var email = User.Identity?.Name ?? throw new IdInvalidException("Không tìm thấy user");
            var user = await _userService.GetUserByEmailAsync(email);
            if (user == null) throw new IdInvalidException("User không tồn tại");

            var refreshToken = Request.Cookies["refresh_token"];
            string? currentJti = null;
            if (!string.IsNullOrEmpty(refreshToken))
            {
                try
                {
                    var principal = _authService.ValidateRefreshToken(refreshToken);
                    currentJti = principal?.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
                }
                catch { /* Ignore */ }
            }

            var sessions = await _userService.GetSessionsForUserAsync(user.Id);
            var dtos = sessions.Select(s => new ResSessionDTO(s, currentJti)).ToList();
            return Ok(dtos);
        }

        [HttpDelete("auth/sessions")]
        [Authorize]
        [ApiMessage("Đăng xuất nhiều thiết bị cụ thể")]
        public async Task<IActionResult> LogoutSessions([FromBody] ReqDeleteSessionsDTO deleteDTO)
        {
            var email = User.Identity?.Name ?? throw new IdInvalidException("Không tìm thấy user");
            var user = await _userService.GetUserByEmailAsync(email);
            if (user == null) throw new IdInvalidException("User không tồn tại");

            var refreshToken = Request.Cookies["refresh_token"];
            string? currentJti = null;
            if (!string.IsNullOrEmpty(refreshToken))
            {
                try
                {
                    var principal = _authService.ValidateRefreshToken(refreshToken);
                    currentJti = principal?.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
                }
                catch { /* Ignore */ }
            }

            // Filter out current session from deletion list if present
            var idsToDelete = deleteDTO.Ids ?? new List<long>();
            if (!string.IsNullOrEmpty(currentJti))
            {
                var currentSession = await _userService.FindSessionByJtiAsync(currentJti);
                if (currentSession != null)
                {
                    idsToDelete.Remove(currentSession.Id);
                }
            }

            await _userService.DeleteSessionsByIdsAsync(idsToDelete, user.Id);
            
            // Update last security timestamp to invalidate existing access tokens of target devices
            user.LastSecurityUpdateAt = DateTime.UtcNow;
            await _userService.SaveUserAsync(user);

            return Ok(null);
        }

        private void SetRefreshTokenCookie(string token)
        {
            var expSeconds = int.Parse(_config["Jwt:RefreshTokenExpirationSeconds"] ?? "604800");
            Response.Cookies.Append("refresh_token", token, new CookieOptions
            {
                HttpOnly = true, Secure = true, Path = "/", MaxAge = TimeSpan.FromSeconds(expSeconds), SameSite = SameSiteMode.Strict
            });
        }
    }
}

