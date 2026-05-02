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
    public class CommentController : ControllerBase
    {
        private readonly ICommentService _commentService;

        public CommentController(ICommentService commentService)
        {
            _commentService = commentService;
        }

        [HttpPost("comments")]
        [ApiMessage("Create a comment")]
        public async Task<IActionResult> CreateComment([FromBody] ReqCreateCommentDTO commentDTO)
        {
            var res = await _commentService.CreateCommentAsync(commentDTO);
            return StatusCode(201, res);
        }

        [HttpPost("comments/update")]
        [ApiMessage("Update a comment")]
        public async Task<IActionResult> UpdateComment([FromBody] ReqUpdateCommentDTO commentDTO)
        {
            var res = await _commentService.UpdateCommentAsync(commentDTO);
            return Ok(res);
        }

        [HttpGet("comments/by-company/{companyId}")]
        [AllowAnonymous]
        [ApiMessage("Fetch comments by company id")]
        public async Task<IActionResult> GetCommentsByCompany(long companyId, [FromQuery] int page = 1, [FromQuery] int size = 10)
        {
            var res = await _commentService.GetCommentsByCompanyAsync(companyId, page, size);
            return Ok(res);
        }
    }
}
