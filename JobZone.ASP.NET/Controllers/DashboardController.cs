using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using JobZone.ASP.NET.Filters;
using JobZone.ASP.NET.Services;

namespace JobZone.ASP.NET.Controllers
{
    [Route("api/v1")]
    [ApiController]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [HttpGet("dashboard")]
        [AllowAnonymous]
        [ApiMessage("Fetch dashboard statistics")]
        public async Task<IActionResult> GetDashboard()
        {
            var res = await _dashboardService.GetDashboardStatsAsync();
            return Ok(res);
        }
    }
}
