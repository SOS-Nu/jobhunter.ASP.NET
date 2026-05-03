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

        public JobController(IJobService jobService) { _jobService = jobService; }

        [HttpPost("jobs")]
        [ApiMessage("Create a job")]
        public async Task<IActionResult> Create([FromBody] ReqCreateJobDTO dto)
        {
            return StatusCode(201, await _jobService.CreateAsync(dto));
        }

        [HttpPut("jobs")]
        [ApiMessage("Update a job")]
        public async Task<IActionResult> Update([FromBody] Job job)
        {
            var result = await _jobService.UpdateAsync(job) ?? throw new IdInvalidException("Job not found");
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
            return StatusCode(201, await _jobService.CreateForUserCompanyAsync(dto));
        }

        [HttpPut("jobs/by-user-company")]
        [ApiMessage("Update a job for user's company")]
        public async Task<IActionResult> UpdateForUserCompany([FromBody] ReqUpdateJobDTO dto)
        {
            return Ok(await _jobService.UpdateForUserCompanyAsync(dto));
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
