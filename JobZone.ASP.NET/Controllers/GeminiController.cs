using JobZone.ASP.NET.Filters;
using JobZone.ASP.NET.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobZone.ASP.NET.Controllers
{
    [Route("api/v1")]
    [ApiController]
    [Authorize]
    public class GeminiController : ControllerBase
    {
        private readonly IGeminiService _geminiService;

        public GeminiController(IGeminiService geminiService)
        {
            _geminiService = geminiService;
        }

        [HttpPost("jobs/ai")]
        [ApiMessage("Fetch jobs with AI ranking")]
        public async Task<IActionResult> FindJobsAI(
            [FromForm] string? skillsDescription,
            [FromForm] IFormFile? file,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var result = await _geminiService.FindJobsWithAIAsync(skillsDescription, file, page, pageSize);
            return Ok(result);
        }

        [HttpPost("evaluate-cv")]
        [ApiMessage("Evaluate CV with AI")]
        public async Task<IActionResult> EvaluateCv(
            [FromForm] IFormFile? cvFile,
            [FromQuery] string language = "vi")
        {
            var result = await _geminiService.EvaluateCandidateCvAsync(cvFile, language);
            return Ok(result);
        }
    }
}
