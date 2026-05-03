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
