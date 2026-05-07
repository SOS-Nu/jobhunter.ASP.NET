using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using JobZone.ASP.NET.Middleware;
using JobZone.ASP.NET.Filters;
using JobZone.ASP.NET.Services;
using Sieve.Models;

namespace JobZone.ASP.NET.Controllers
{
    [Route("api/v1/user-save-jobs")]
    [ApiController]
    [Authorize]
    public class UserSaveJobController : ControllerBase
    {
        private readonly IUserSaveJobService _userSaveJobService;

        public UserSaveJobController(IUserSaveJobService userSaveJobService)
        {
            _userSaveJobService = userSaveJobService;
        }

        [HttpPost("{jobId}")]
        [ApiMessage("Lưu công việc")]
        public async Task<IActionResult> SaveJob(long jobId)
        {
            return StatusCode(201, await _userSaveJobService.SaveJobAsync(jobId));
        }

        [HttpDelete("{jobId}")]
        [ApiMessage("Hủy lưu công việc")]
        public async Task<IActionResult> UnsaveJob(long jobId)
        {
            await _userSaveJobService.UnsaveJobAsync(jobId);
            return Ok(null);
        }

        [HttpGet]
        [ApiMessage("Lấy danh sách công việc đã lưu")]
        public async Task<IActionResult> GetSavedJobs([FromQuery] SieveModel sieveModel)
        {
            return Ok(await _userSaveJobService.GetSavedJobsAsync(sieveModel));
        }

        [HttpGet("is-saved/{jobId}")]
        [ApiMessage("Kiểm tra công việc đã lưu chưa")]
        public async Task<IActionResult> IsJobSaved(long jobId)
        {
            return Ok(await _userSaveJobService.IsJobSavedAsync(jobId));
        }
    }
}
