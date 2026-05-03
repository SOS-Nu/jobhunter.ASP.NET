using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using JobZone.ASP.NET.DTOs.Request;
using JobZone.ASP.NET.Entities;
using JobZone.ASP.NET.Filters;
using JobZone.ASP.NET.Middleware;
using JobZone.ASP.NET.Services;

namespace JobZone.ASP.NET.Controllers
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
        public async Task<IActionResult> Create([FromBody] ReqCreateSubscriberDTO dto)
        {
            bool isExist = await _subscriberService.IsExistsByEmailAsync(dto.Email);
            if (isExist)
            {
                throw new IdInvalidException($"Email {dto.Email} đã tồn tại");
            }

            var subscriber = new Subscriber
            {
                Email = dto.Email,
                Name = dto.Name
            };

            var createdSub = await _subscriberService.CreateAsync(subscriber, dto.Skills?.Select(s => s.Id).ToList());
            return StatusCode(201, createdSub);
        }

        [HttpPut("subscribers")]
        [ApiMessage("Update a subscriber")]
        public async Task<IActionResult> Update([FromBody] ReqUpdateSubscriberDTO dto)
        {
            var subsDB = await _subscriberService.FindByIdAsync(dto.Id);
            if (subsDB == null)
            {
                throw new IdInvalidException($"Id {dto.Id} không tồn tại");
            }

            var updatedSub = await _subscriberService.UpdateAsync(subsDB, dto.Skills?.Select(s => s.Id).ToList());
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
