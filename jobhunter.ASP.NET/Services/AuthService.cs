using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using jobhunter.ASP.NET.DTOs.Response;

namespace jobhunter.ASP.NET.Services
{
    /// <summary>
    /// JWT token creation service.
    /// Maps from: vn.hoidanit.jobhunter.util.SecurityUtil
    /// </summary>
    public interface IAuthService
    {
        string CreateAccessToken(string email, ResLoginDTO dto);
        string CreateRefreshToken(string email, ResLoginDTO dto);
        ClaimsPrincipal? ValidateRefreshToken(string token);
    }

    public class AuthService : IAuthService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<AuthService> _logger;

        public AuthService(IConfiguration config, ILogger<AuthService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public string CreateAccessToken(string email, ResLoginDTO dto)
        {
            var secretKey = _config["Jwt:SecretKey"]!;
            var expSeconds = int.Parse(_config["Jwt:AccessTokenExpirationSeconds"] ?? "86400");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512);

            var jti = Guid.NewGuid().ToString();

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, email),
                new Claim(JwtRegisteredClaimNames.Jti, jti),
                new Claim("id", dto.User?.Id.ToString() ?? "0"),
                new Claim(ClaimTypes.Name, email),
            };

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddSeconds(expSeconds),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public string CreateRefreshToken(string email, ResLoginDTO dto)
        {
            var secretKey = _config["Jwt:SecretKey"]!;
            var expSeconds = int.Parse(_config["Jwt:RefreshTokenExpirationSeconds"] ?? "604800");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512);

            var jti = Guid.NewGuid().ToString();

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, email),
                new Claim(JwtRegisteredClaimNames.Jti, jti),
                new Claim("id", dto.User?.Id.ToString() ?? "0"),
            };

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddSeconds(expSeconds),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public ClaimsPrincipal? ValidateRefreshToken(string token)
        {
            try
            {
                var secretKey = _config["Jwt:SecretKey"]!;
                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));

                var tokenHandler = new JwtSecurityTokenHandler();
                var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = key,
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                }, out _);

                return principal;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, ">>> Refresh Token error: {Message}", ex.Message);
                return null;
            }
        }
    }
}
