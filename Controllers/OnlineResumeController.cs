using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using jobhunter.ASP.NET.Entities;
using jobhunter.ASP.NET.Filters;
using jobhunter.ASP.NET.Services;

namespace jobhunter.ASP.NET.Controllers
{
    [Route("api/v1/online-resumes")]
    [ApiController]
    [Authorize]
    public class OnlineResumeController : ControllerBase
    {
        private readonly IOnlineResumeService _onlineResumeService;

        public OnlineResumeController(IOnlineResumeService onlineResumeService)
        {
            _onlineResumeService = onlineResumeService;
        }

        [HttpPost]
        [ApiMessage("Tạo mới Online Resume")]
        public async Task<IActionResult> CreateOnlineResume([FromBody] OnlineResume resume)
        {
            var newResume = await _onlineResumeService.CreateOnlineResumeAsync(resume);
            return StatusCode(201, newResume);
        }

        [HttpPut]
        [ApiMessage("Cập nhật Online Resume")]
        public async Task<IActionResult> UpdateOnlineResume([FromBody] OnlineResume resume)
        {
            var updatedResume = await _onlineResumeService.UpdateOnlineResumeAsync(resume);
            return Ok(updatedResume);
        }

        [HttpDelete]
        [ApiMessage("Xóa Online Resume")]
        public async Task<IActionResult> DeleteOnlineResume()
        {
            await _onlineResumeService.DeleteOnlineResumeAsync();
            return Ok(null);
        }

        [HttpGet("my-resume")]
        [ApiMessage("Lấy Online Resume của tôi")]
        public async Task<IActionResult> GetMyOnlineResume()
        {
            var resume = await _onlineResumeService.GetMyOnlineResumeAsync();
            if (resume != null)
            {
                return Ok(resume);
            }
            return NotFound();
        }
    }
}
