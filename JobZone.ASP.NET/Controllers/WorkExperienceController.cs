using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using JobZone.ASP.NET.DTOs.Request;
using JobZone.ASP.NET.Filters;
using JobZone.ASP.NET.Services;

namespace JobZone.ASP.NET.Controllers
{
    [Route("api/v1/work-experiences")]
    [ApiController]
    [Authorize]
    public class WorkExperienceController : ControllerBase
    {
        private readonly IWorkExperienceService _workExperienceService;

        public WorkExperienceController(IWorkExperienceService workExperienceService)
        {
            _workExperienceService = workExperienceService;
        }

        [HttpPost]
        [ApiMessage("Tạo mới kinh nghiệm làm việc")]
        public async Task<IActionResult> Create([FromBody] ReqCreateWorkExperienceDTO dto)
        {
            var res = await _workExperienceService.CreateAsync(dto);
            return StatusCode(201, res);
        }

        [HttpPut]
        [ApiMessage("Cập nhật kinh nghiệm làm việc")]
        public async Task<IActionResult> Update([FromBody] ReqUpdateWorkExperienceDTO dto)
        {
            var res = await _workExperienceService.UpdateAsync(dto);
            return Ok(res);
        }

        [HttpDelete("{id}")]
        [ApiMessage("Xóa kinh nghiệm làm việc")]
        public async Task<IActionResult> Delete(long id)
        {
            await _workExperienceService.DeleteAsync(id);
            return Ok(null);
        }

        [HttpGet("my-experiences")]
        [ApiMessage("Lấy danh sách kinh nghiệm làm việc của tôi")]
        public async Task<IActionResult> GetMyWorkExperiences()
        {
            var res = await _workExperienceService.GetMyWorkExperiencesAsync();
            return Ok(res);
        }
    }
}
