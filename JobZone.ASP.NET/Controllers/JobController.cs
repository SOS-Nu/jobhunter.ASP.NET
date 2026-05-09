using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using JobZone.ASP.NET.DTOs.Request;
using JobZone.ASP.NET.Entities;
using JobZone.ASP.NET.Filters;
using JobZone.ASP.NET.Middleware;
using JobZone.ASP.NET.Services;
using Sieve.Models;

namespace JobZone.ASP.NET.Controllers
{
    [Route("api/v1")]
    [ApiController]
    [Authorize]
    public class JobController : ControllerBase
    {
        private readonly IJobService _jobService;
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly ILogger<JobController> _logger;

        public JobController(IJobService jobService, IServiceScopeFactory serviceScopeFactory, ILogger<JobController> logger)
        {
            _jobService = jobService;
            _serviceScopeFactory = serviceScopeFactory;
            _logger = logger;
        }

        [HttpPost("jobs")]
        [ApiMessage("Create a job")]
        public async Task<IActionResult> Create([FromBody] ReqCreateJobDTO dto)
        {
            var result = await _jobService.CreateAsync(dto);
            
            // Fire and forget safely using a new scope
            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = _serviceScopeFactory.CreateScope();
                    var subscriberService = scope.ServiceProvider.GetRequiredService<ISubscriberService>();
                    await subscriberService.SendSubscribersEmailJobsAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error sending emails in background after job creation");
                }
            });

            return StatusCode(201, result);
        }

        [HttpPost("jobs/bulk-create")]
        [ApiMessage("Create bulk list job")]
        public async Task<IActionResult> BulkCreate([FromBody] List<JobBulkCreateDTO> jobDTOs)
        {
            return StatusCode(201, await _jobService.HandleBulkCreateJobsAsync(jobDTOs));
        }

        [HttpPut("jobs")]
        [ApiMessage("Update a job")]
        public async Task<IActionResult> Update([FromBody] ReqUpdateJobDTO dto)
        {
            var result = await _jobService.UpdateAsync(dto) ?? throw new IdInvalidException("Job not found");
            
            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = _serviceScopeFactory.CreateScope();
                    var subscriberService = scope.ServiceProvider.GetRequiredService<ISubscriberService>();
                    await subscriberService.SendSubscribersEmailJobsAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error sending emails in background after job update");
                }
            });

            return Ok(result);
        }

        [HttpDelete("jobs/{id}")]
        [ApiMessage("Delete a job by id")]
        public async Task<IActionResult> Delete(long id)
        {
            await _jobService.DeleteAsync(id);
            return Ok(null);
        }

        [HttpGet("jobs/{id}")]
        [AllowAnonymous]
        [ApiMessage("Get a job by id")]
        public async Task<IActionResult> GetById(long id)
        {
            var dto = await _jobService.GetByIdAsync(id) ?? throw new IdInvalidException($"Job với id = {id} không tồn tại");
            return Ok(dto);
        }

        [HttpGet("jobs")]
        [AllowAnonymous]
        [ApiMessage("Get job with pagination")]
        public async Task<IActionResult> GetAll([FromQuery] SieveModel sieveModel)
        {
            return Ok(await _jobService.GetAllAsync(sieveModel));
        }

        [HttpGet("jobs/by-company/{companyId}")]
        [AllowAnonymous]
        [ApiMessage("Fetch jobs by company id")]
        public async Task<IActionResult> GetByCompany(long companyId, [FromQuery] SieveModel sieveModel)
        {
            return Ok(await _jobService.GetByCompanyAsync(companyId, sieveModel));
        }

        [HttpPost("jobs/by-user-company")]
        [ApiMessage("Create a job for user's company")]
        public async Task<IActionResult> CreateForUserCompany([FromBody] ReqCreateJobDTO dto)
        {
            var result = await _jobService.CreateForUserCompanyAsync(dto);
            
            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = _serviceScopeFactory.CreateScope();
                    var subscriberService = scope.ServiceProvider.GetRequiredService<ISubscriberService>();
                    await subscriberService.SendSubscribersEmailJobsAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error sending emails in background after job creation");
                }
            });

            return StatusCode(201, result);
        }

        [HttpPut("jobs/by-user-company")]
        [ApiMessage("Update a job for user's company")]
        public async Task<IActionResult> UpdateForUserCompany([FromBody] ReqUpdateJobDTO dto)
        {
            var result = await _jobService.UpdateForUserCompanyAsync(dto);
            
            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = _serviceScopeFactory.CreateScope();
                    var subscriberService = scope.ServiceProvider.GetRequiredService<ISubscriberService>();
                    await subscriberService.SendSubscribersEmailJobsAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error sending emails in background after job update");
                }
            });

            return Ok(result);
        }

        [HttpDelete("jobs/by-user-company/{id}")]
        [ApiMessage("Delete a job for user's company")]
        public async Task<IActionResult> DeleteForUserCompany(long id)
        {
            await _jobService.DeleteForUserCompanyAsync(id);
            return Ok(null);
        }
    }
}
