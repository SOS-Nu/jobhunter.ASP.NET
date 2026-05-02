using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using jobhunter.ASP.NET.Filters;
using jobhunter.ASP.NET.Services;

namespace jobhunter.ASP.NET.Controllers
{
    [Route("api/v1")]
    [ApiController]
    [Authorize]
    public class EmailController : ControllerBase
    {
        private readonly ISubscriberService _subscriberService;

        public EmailController(ISubscriberService subscriberService)
        {
            _subscriberService = subscriberService;
        }

        [HttpGet("email")]
        [ApiMessage("Send simple email")]
        public async Task<IActionResult> SendSimpleEmail()
        {
            await _subscriberService.SendSubscribersEmailJobsAsync();
            return Ok("Email triggered for all subscribers");
        }
    }
}
