using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using jobhunter.ASP.NET.DTOs.Request;
using jobhunter.ASP.NET.Entities;
using jobhunter.ASP.NET.Filters;
using jobhunter.ASP.NET.Middleware;
using jobhunter.ASP.NET.Services;

namespace jobhunter.ASP.NET.Controllers
{
    [Route("api/v1")]
    [ApiController]
    [Authorize]
    public class ResumeController : ControllerBase
    {
        private readonly IResumeService _resumeService;

        public ResumeController(IResumeService resumeService) { _resumeService = resumeService; }

        [HttpPost("resumes")]
        [ApiMessage("Create a resume")]
        public async Task<IActionResult> Create([FromBody] Resume resume)
        {
            return StatusCode(201, await _resumeService.CreateAsync(resume));
        }

        [HttpPut("resumes")]
        [ApiMessage("Update a resume")]
        public async Task<IActionResult> Update([FromBody] ReqUpdateResumeDTO dto)
        {
            var result = await _resumeService.UpdateAsync(dto.Id, dto.Status)
                ?? throw new IdInvalidException($"Resume với id = {dto.Id} không tồn tại");
            return Ok(result);
        }

        [HttpDelete("resumes/{id}")]
        [ApiMessage("Delete a resume by id")]
        public async Task<IActionResult> Delete(long id)
        {
            var resume = await _resumeService.GetByIdAsync(id)
                ?? throw new IdInvalidException($"Resume với id = {id} không tồn tại");
            await _resumeService.DeleteAsync(id);
            return Ok(null);
        }

        [HttpGet("resumes/{id}")]
        [ApiMessage("Fetch a resume by id")]
        public async Task<IActionResult> GetById(long id)
        {
            var dto = await _resumeService.GetByIdAsync(id)
                ?? throw new IdInvalidException($"Resume với id = {id} không tồn tại");
            return Ok(dto);
        }

        [HttpGet("resumes")]
        [ApiMessage("Fetch all resume with paginate")]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int size = 10)
        {
            return Ok(await _resumeService.GetAllAsync(page, size));
        }

        [HttpPost("resumes/by-user")]
        [ApiMessage("Get list resumes by user")]
        public async Task<IActionResult> GetByUser([FromQuery] int page = 1, [FromQuery] int size = 10)
        {
            return Ok(await _resumeService.GetByUserAsync(page, size));
        }
    }
}
