using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using jobhunter.ASP.NET.DTOs.Request;
using jobhunter.ASP.NET.DTOs.Response;
using jobhunter.ASP.NET.Entities;
using jobhunter.ASP.NET.Filters;
using jobhunter.ASP.NET.Middleware;
using jobhunter.ASP.NET.Services;

namespace jobhunter.ASP.NET.Controllers
{
    [Route("api/v1")]
    [ApiController]
    [Authorize]
    public class CompanyController : ControllerBase
    {
        private readonly ICompanyService _companyService;
        private readonly IMapper _mapper;

        public CompanyController(ICompanyService companyService, IMapper mapper)
        {
            _companyService = companyService; _mapper = mapper;
        }

        [HttpPost("companies")]
        [ApiMessage("Create a company by admin")]
        public async Task<IActionResult> Create([FromBody] Company company)
        {
            var created = await _companyService.CreateCompanyAsync(company);
            return StatusCode(201, created);
        }

        [HttpGet("companies")]
        [AllowAnonymous]
        [ApiMessage("Fetch all Companies")]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int size = 10, [FromQuery] string? filter = null)
        {
            return Ok(await _companyService.GetAllCompaniesAsync(page, size, filter));
        }

        [HttpPut("companies")]
        [ApiMessage("Update a company by admin")]
        public async Task<IActionResult> Update([FromBody] Company company)
        {
            var updated = await _companyService.UpdateCompanyAsync(company);
            return Ok(updated);
        }

        [HttpDelete("companies/{id}")]
        [ApiMessage("Delete a company by admin")]
        public async Task<IActionResult> Delete(long id)
        {
            await _companyService.DeleteCompanyAsync(id);
            return Ok(null);
        }

        [HttpGet("companies/{id}")]
        [AllowAnonymous]
        [ApiMessage("Fetch company by id")]
        public async Task<IActionResult> GetById(long id)
        {
            var dto = await _companyService.GetCompanyByIdAsync(id)
                ?? throw new IdInvalidException($"Không tìm thấy công ty với id {id}");
            return Ok(dto);
        }

        [HttpPost("companies/by-user")]
        [ApiMessage("Create a company for the current user")]
        public async Task<IActionResult> CreateByUser([FromBody] ReqCreateCompanyDTO req)
        {
            return StatusCode(201, await _companyService.CreateCompanyByUserAsync(req));
        }

        [HttpPut("companies/by-user")]
        [ApiMessage("Update a company that user created")]
        public async Task<IActionResult> UpdateByUser([FromBody] ReqUpdateCompanyDTO req)
        {
            return Ok(await _companyService.UpdateCompanyByUserAsync(req));
        }

        [HttpDelete("companies/by-user")]
        [ApiMessage("Delete a company that user created")]
        public async Task<IActionResult> DeleteByUser()
        {
            await _companyService.DeleteCompanyByUserAsync();
            return Ok(null);
        }
    }
}
