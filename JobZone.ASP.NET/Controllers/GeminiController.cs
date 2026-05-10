using JobZone.ASP.NET.Filters;
using JobZone.ASP.NET.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobZone.ASP.NET.Controllers
{
    [Route("api/v1/gemini")]
    [ApiController]
    [Authorize]
    public class GeminiController : ControllerBase
    {
        private readonly IGeminiService _geminiService;

        public GeminiController(IGeminiService geminiService)
        {
            _geminiService = geminiService;
        }

        [HttpPost("jobs")]
        [ApiMessage("Fetch jobs with AI ranking")]
        public async Task<IActionResult> FindJobsAI(
            [FromForm] ReqGeminiJobSearchDTO dto,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var result = await _geminiService.FindJobsWithAIAsync(dto.SkillsDescription, dto.File, page, pageSize);
            return Ok(result);
        }

        [HttpPost("evaluate-cv")]
        [ApiMessage("Evaluate CV with AI")]
        public async Task<IActionResult> EvaluateCv(
            [FromForm] ReqEvaluateCvDTO dto,
            [FromQuery] string language = "vi")
        {
            var result = await _geminiService.EvaluateCandidateCvAsync(dto.CvFile, language);
            return Ok(result);
        }
    }

    public class ReqGeminiJobSearchDTO
    {
        public string? SkillsDescription { get; set; }
        public IFormFile? File { get; set; }
    }

    public class ReqEvaluateCvDTO
    {
        public IFormFile? CvFile { get; set; }
    }
}
