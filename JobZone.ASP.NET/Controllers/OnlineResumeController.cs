using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using JobZone.ASP.NET.DTOs.Request;
using JobZone.ASP.NET.Filters;
using JobZone.ASP.NET.Services;

namespace JobZone.ASP.NET.Controllers
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
        public async Task<IActionResult> Create([FromBody] ReqCreateOnlineResumeDTO dto)
        {
            var result = await _onlineResumeService.CreateAsync(dto);
            return StatusCode(201, result);
        }

        [HttpPut]
        [ApiMessage("Cập nhật Online Resume")]
        public async Task<IActionResult> Update([FromBody] ReqUpdateOnlineResumeDTO dto)
        {
            var result = await _onlineResumeService.UpdateAsync(dto);
            return Ok(result);
        }

        [HttpDelete]
        [ApiMessage("Xóa Online Resume")]
        public async Task<IActionResult> Delete()
        {
            await _onlineResumeService.DeleteAsync();
            return Ok(null);
        }

        [HttpGet("my-resume")]
        [ApiMessage("Lấy Online Resume của tôi")]
        public async Task<IActionResult> GetMyResume()
        {
            var result = await _onlineResumeService.GetMyResumeAsync();
            return result != null ? Ok(result) : NotFound();
        }
    }
}
