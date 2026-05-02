using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using jobhunter.ASP.NET.DTOs.Request;
using jobhunter.ASP.NET.Filters;
using jobhunter.ASP.NET.Services;

namespace jobhunter.ASP.NET.Controllers
{
    [Route("api/v1")]
    [ApiController]
    [Authorize]
    public class SkillController : ControllerBase
    {
        private readonly ISkillService _skillService;

        public SkillController(ISkillService skillService)
        {
            _skillService = skillService;
        }

        [HttpPost("skills")]
        [ApiMessage("Create a skill")]
        public async Task<IActionResult> Create([FromBody] ReqCreateSkillDTO dto)
        {
            var res = await _skillService.CreateAsync(dto);
            return StatusCode(201, res);
        }

        [HttpPost("skills/bulk-create")]
        [ApiMessage("Create list bulk skill")]
        public async Task<IActionResult> BulkCreate([FromBody] List<ReqBulkCreateSkillDTO> dtos)
        {
            var res = await _skillService.BulkCreateAsync(dtos);
            return StatusCode(201, res);
        }

        [HttpPut("skills")]
        [ApiMessage("Update a skill")]
        public async Task<IActionResult> Update([FromBody] ReqUpdateSkillDTO dto)
        {
            var res = await _skillService.UpdateAsync(dto);
            return Ok(res);
        }

        [HttpDelete("skills/{id}")]
        [ApiMessage("Delete a skill")]
        public async Task<IActionResult> Delete(long id)
        {
            await _skillService.DeleteAsync(id);
            return Ok(null);
        }

        [HttpGet("skills")]
        [ApiMessage("fetch all skills")]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int size = 10)
        {
            var res = await _skillService.GetAllAsync(page, size);
            return Ok(res);
        }
    }
}
