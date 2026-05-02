using System.Text.RegularExpressions;
using jobhunter.ASP.NET.Middleware;

namespace jobhunter.ASP.NET.Filters
{
    /// <summary>
    /// Custom Permission Handler as ActionFilter.
    /// Maps from: vn.hoidanit.jobhunter.config.PermissionInterceptor (HandlerInterceptor)
    /// 
    /// agents.md rule 4:
    ///   - Permission format: METHOD:/api/path
    ///   - Normalize routes: /api/v1/users/123 → /api/v1/users/*
    ///   - Use policy-based authorization with custom PermissionHandler
    /// </summary>
    public static class PermissionActionFilter
    {
        /// <summary>
        /// Whitelist paths that bypass permission checks.
        /// Maps from: PermissionInterceptorConfiguration.whiteList in Spring Boot.
        /// </summary>
        private static readonly string[] WhitelistPatterns = new[]
        {
            "/api/v1/auth/",
            "/storage/",
            "/api/v1/companies/",
            "/api/v1/jobs/",
            "/api/v1/skills/",
            "/api/v1/files",
            "/api/v1/resumes/",
            "/api/v1/subscribers/",
            "/api/v1/payment/vnpay/",
            "/api/v1/payment/history/",
            "/api/v1/messages/",
            "/api/v1/comments/",
            "/api/v1/users/main-resume",
            "/api/v1/online-resumes/",
            "/api/v1/work-experiences/",
            "/api/v1/users/detail/",
            "/api/v1/users/is-public",
            "/api/v1/dashboard",
            "/api/v1/gemini/",
            "/api/v1/payment/export/",
            "/actuator/",
            "/error"
        };

        /// <summary>
        /// Normalizes a request path by replacing numeric segments with *.
        /// Example: /api/v1/users/123 → /api/v1/users/*
        /// </summary>
        public static string NormalizePath(string path)
        {
            // Replace numeric path segments with *
            return Regex.Replace(path, @"/\d+", "/*");
        }

        /// <summary>
        /// Checks if a path matches any whitelist pattern.
        /// </summary>
        public static bool IsWhitelisted(string path)
        {
            return WhitelistPatterns.Any(pattern =>
                path.StartsWith(pattern, StringComparison.OrdinalIgnoreCase) ||
                path.Equals(pattern.TrimEnd('/'), StringComparison.OrdinalIgnoreCase));
        }
    }
}
