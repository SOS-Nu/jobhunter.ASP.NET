using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using jobhunter.ASP.NET.DTOs.Request;
using jobhunter.ASP.NET.Entities;
using jobhunter.ASP.NET.Filters;
using jobhunter.ASP.NET.Middleware;
using jobhunter.ASP.NET.Services;

namespace jobhunter.ASP.NET.Controllers
{
    /// <summary>
    /// Maps from: vn.hoidanit.jobhunter.controller.RoleController
    /// Full CRUD with name-existence check and permission resolution.
    /// </summary>
    [Route("api/v1")]
    [ApiController]
    [Authorize]
    public class RoleController : ControllerBase
    {
        private readonly IRoleService _roleService;

        public RoleController(IRoleService roleService)
        {
            _roleService = roleService;
        }

        /// <summary>
        /// Create a role.
        /// Java logic: Check if role name exists → throw if exists.
        /// </summary>
        [HttpPost("roles")]
        [ApiMessage("Create a role")]
        public async Task<IActionResult> Create([FromBody] ReqCreateRoleDTO dto)
        {
            if (await _roleService.ExistByNameAsync(dto.Name))
            {
                throw new IdInvalidException($"Role với name = {dto.Name} đã tồn tại");
            }

            var role = new Role
            {
                Name = dto.Name,
                Description = dto.Description,
                Active = dto.Active,
                Permissions = dto.Permissions?.Select(p => new Permission { Id = p.Id }).ToList()
                    ?? new List<Permission>()
            };

            var created = await _roleService.CreateAsync(role);
            return StatusCode(201, created);
        }

        /// <summary>
        /// Update a role.
        /// Java logic: Check if role exists by ID → throw if not found.
        /// </summary>
        [HttpPut("roles")]
        [ApiMessage("Update a role")]
        public async Task<IActionResult> Update([FromBody] ReqUpdateRoleDTO dto)
        {
            var existing = await _roleService.FetchByIdAsync(dto.Id)
                ?? throw new IdInvalidException($"Role với id = {dto.Id} không tồn tại");

            var role = new Role
            {
                Id = dto.Id,
                Name = dto.Name,
                Description = dto.Description,
                Active = dto.Active,
                Permissions = dto.Permissions?.Select(p => new Permission { Id = p.Id }).ToList()
                    ?? new List<Permission>()
            };

            var updated = await _roleService.UpdateAsync(role);
            return Ok(updated);
        }

        /// <summary>
        /// Delete a role by ID.
        /// Java logic: Check existence first → throw if not found.
        /// </summary>
        [HttpDelete("roles/{id}")]
        [ApiMessage("Delete a role")]
        public async Task<IActionResult> Delete(long id)
        {
            var existing = await _roleService.FetchByIdAsync(id)
                ?? throw new IdInvalidException($"Role với id = {id} không tồn tại");

            await _roleService.DeleteAsync(id);
            return Ok(null);
        }

        /// <summary>
        /// Fetch roles with pagination.
        /// Maps from: RoleController.getRoles(@Filter Specification, Pageable)
        /// </summary>
        [HttpGet("roles")]
        [ApiMessage("Fetch roles")]
        public async Task<IActionResult> GetRoles([FromQuery] int page = 1, [FromQuery] int size = 10, [FromQuery] string? filter = null)
        {
            return Ok(await _roleService.GetRolesAsync(page, size, filter));
        }

        /// <summary>
        /// Fetch role by ID.
        /// Maps from: RoleController.getById(@PathVariable Long id)
        /// </summary>
        [HttpGet("roles/{id}")]
        [ApiMessage("Fetch role by id")]
        public async Task<IActionResult> GetById(long id)
        {
            var role = await _roleService.FetchByIdAsync(id)
                ?? throw new IdInvalidException($"Role với id = {id} không tồn tại");
            return Ok(role);
        }
    }
}
