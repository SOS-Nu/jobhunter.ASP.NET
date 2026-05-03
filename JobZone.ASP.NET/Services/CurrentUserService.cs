namespace JobZone.ASP.NET.Services
{
    /// <summary>
    /// Scoped service to access current authenticated user info.
    /// agents.md rule 4: Use ICurrentUserService, DO NOT use static classes.
    /// Maps from: SecurityUtil.getCurrentUserLogin() in Spring Boot.
    /// </summary>
    public interface ICurrentUserService
    {
        string? GetCurrentUserEmail();
        long? GetCurrentUserId();
    }

    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public string? GetCurrentUserEmail()
        {
            return _httpContextAccessor.HttpContext?.User?.Identity?.Name;
        }

        public long? GetCurrentUserId()
        {
            var idClaim = _httpContextAccessor.HttpContext?.User?.FindFirst("id");
            if (idClaim != null && long.TryParse(idClaim.Value, out var id))
            {
                return id;
            }
            return null;
        }
    }
}
