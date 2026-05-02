using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using jobhunter.ASP.NET.Filters;
using jobhunter.ASP.NET.Services;

namespace jobhunter.ASP.NET.Controllers
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
        [ApiMessage("Fetch dashboard statistics")]
        public async Task<IActionResult> GetDashboard()
        {
            var res = await _dashboardService.GetDashboardStatsAsync();
            return Ok(res);
        }
    }
}
