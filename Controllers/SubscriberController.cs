using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using jobhunter.ASP.NET.Entities;
using jobhunter.ASP.NET.Filters;
using jobhunter.ASP.NET.Middleware;
using jobhunter.ASP.NET.Services;

namespace jobhunter.ASP.NET.Controllers
{
    [Route("api/v1")]
    [ApiController]
    [Authorize]
    public class SubscriberController : ControllerBase
    {
        private readonly ISubscriberService _subscriberService;
        private readonly ICurrentUserService _currentUserService;

        public SubscriberController(ISubscriberService subscriberService, ICurrentUserService currentUserService)
        {
            _subscriberService = subscriberService;
            _currentUserService = currentUserService;
        }

        [HttpPost("subscribers")]
        [ApiMessage("Create a subscriber")]
        public async Task<IActionResult> Create([FromBody] Subscriber sub)
        {
            bool isExist = await _subscriberService.IsExistsByEmailAsync(sub.Email);
            if (isExist)
            {
                throw new IdInvalidException($"Email {sub.Email} đã tồn tại");
            }

            var createdSub = await _subscriberService.CreateAsync(sub);
            return StatusCode(201, createdSub);
        }

        [HttpPut("subscribers")]
        [ApiMessage("Update a subscriber")]
        public async Task<IActionResult> Update([FromBody] Subscriber subsRequest)
        {
            var subsDB = await _subscriberService.FindByIdAsync(subsRequest.Id);
            if (subsDB == null)
            {
                throw new IdInvalidException($"Id {subsRequest.Id} không tồn tại");
            }

            var updatedSub = await _subscriberService.UpdateAsync(subsDB, subsRequest);
            return Ok(updatedSub);
        }

        [HttpPost("subscribers/skills")]
        [ApiMessage("Get subscriber's skill")]
        public async Task<IActionResult> GetSubscribersSkill()
        {
            string? email = _currentUserService.GetCurrentUserEmail() ?? "";
            var subscriber = await _subscriberService.FindByEmailAsync(email);
            return Ok(subscriber);
        }
    }
}
