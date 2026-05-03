using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using jobhunter.ASP.NET.Models;
using System.Text.Json;

namespace jobhunter.ASP.NET.Configuration
{
    /// <summary>
    /// JWT Authentication configuration.
    /// Maps from: vn.hoidanit.jobhunter.config.SecurityConfiguration
    /// 
    /// agents.md rule 4: Use JWT Bearer authentication
    /// </summary>
    public static class JwtConfiguration
    {
        public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
        {
            var jwtSettings = configuration.GetSection("Jwt");
            var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey is not configured");
            var key = Encoding.UTF8.GetBytes(secretKey);

            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = false, // Matching Spring Boot behavior (no issuer validation)
                    ValidateAudience = false, // Matching Spring Boot behavior (no audience validation)
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero // Strict expiration matching Spring Boot
                };

                // Custom response for 401 Unauthorized
                // Maps from: CustomAuthenticationEntryPoint
                options.Events = new JwtBearerEvents
                {
                    OnChallenge = async context =>
                    {
                        context.HandleResponse();
                        context.Response.StatusCode = 401;
                        context.Response.ContentType = "application/json; charset=utf-8";

                        var response = new RestResponse<object>
                        {
                            StatusCode = 401,
                            Error = context.ErrorDescription ?? context.Error ?? "Unauthorized",
                            Message = "Token không hợp lệ (hết hạn, không đúng định dạng, hoặc không truyền JWT ở header)..."
                        };

                        var jsonOptions = new JsonSerializerOptions
                        {
                            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
                        };

                        await context.Response.WriteAsync(JsonSerializer.Serialize(response, jsonOptions));
                    },
                    OnForbidden = async context =>
                    {
                        context.Response.StatusCode = 403;
                        context.Response.ContentType = "application/json; charset=utf-8";

                        var response = new RestResponse<object>
                        {
                            StatusCode = 403,
                            Error = "Forbidden",
                            Message = "Bạn không có quyền truy cập endpoint này."
                        };

                        var jsonOptions = new JsonSerializerOptions
                        {
                            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
                        };

                        await context.Response.WriteAsync(JsonSerializer.Serialize(response, jsonOptions));
                    }
                };
            });

            return services;
        }
    }
}
