namespace jobhunter.ASP.NET.Configuration
{
    /// <summary>
    /// CORS configuration.
    /// Maps from: vn.hoidanit.jobhunter.config.CorsConfig
    /// </summary>
    public static class CorsConfiguration
    {
        public const string PolicyName = "AllowConfiguredOrigins";

        public static IServiceCollection AddCorsConfiguration(this IServiceCollection services, IConfiguration configuration)
        {
            var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                ?? new[] { "http://localhost:3000", "http://localhost:4173", "http://localhost:5173" };

            services.AddCors(options =>
            {
                options.AddPolicy(PolicyName, policy =>
                {
                    policy
                        .WithOrigins(allowedOrigins)
                        .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .WithHeaders("Authorization", "Content-Type", "Accept", "x-no-retry")
                        .AllowAnyHeader()
                        .AllowCredentials()
                        .SetPreflightMaxAge(TimeSpan.FromSeconds(3600));
                });
            });

            return services;
        }
    }
}
