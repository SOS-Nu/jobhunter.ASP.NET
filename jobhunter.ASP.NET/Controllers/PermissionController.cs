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
    /// Maps from: vn.hoidanit.jobhunter.controller.PermissionController
    /// Full CRUD with duplicate validation matching Java logic exactly.
    /// </summary>
    [Route("api/v1")]
    [ApiController]
    [Authorize]
    public class PermissionController : ControllerBase
    {
        private readonly IPermissionService _permissionService;

        public PermissionController(IPermissionService permissionService)
        {
            _permissionService = permissionService;
        }

        /// <summary>
        /// Create a permission.
        /// Java logic: Check if permission exists by module+apiPath+method → throw if exists.
        /// </summary>
        [HttpPost("permissions")]
        [ApiMessage("Create a permission")]
        public async Task<IActionResult> Create([FromBody] ReqCreatePermissionDTO dto)
        {
            if (await _permissionService.IsPermissionExistAsync(dto.Module, dto.ApiPath, dto.Method))
            {
                throw new IdInvalidException("Permission đã tồn tại.");
            }

            var permission = new Permission
            {
                Name = dto.Name,
                ApiPath = dto.ApiPath,
                Method = dto.Method,
                Module = dto.Module
            };

            var created = await _permissionService.CreateAsync(permission);
            return StatusCode(201, created);
        }

        /// <summary>
        /// Update a permission.
        /// Java logic: 
        ///   1. Check if permission exists by ID → throw if not found
        ///   2. Check if permission exists by module+apiPath+method → if same name, throw duplicate
        /// </summary>
        [HttpPut("permissions")]
        [ApiMessage("Update a permission")]
        public async Task<IActionResult> Update([FromBody] ReqUpdatePermissionDTO dto)
        {
            var existing = await _permissionService.FetchByIdAsync(dto.Id)
                ?? throw new IdInvalidException($"Permission với id = {dto.Id} không tồn tại.");

            // Check if permission with same module+apiPath+method already exists
            if (await _permissionService.IsPermissionExistAsync(dto.Module, dto.ApiPath, dto.Method))
            {
                // If same name as existing record → it's a true duplicate
                if (await _permissionService.IsSameNameAsync(dto.Id, dto.Name))
                {
                    throw new IdInvalidException("Permission đã tồn tại.");
                }
            }

            var permission = new Permission
            {
                Id = dto.Id,
                Name = dto.Name,
                ApiPath = dto.ApiPath,
                Method = dto.Method,
                Module = dto.Module
            };

            var updated = await _permissionService.UpdateAsync(permission);
            return Ok(updated);
        }

        /// <summary>
        /// Delete a permission by ID.
        /// Java logic: Check existence first → throw if not found.
        /// </summary>
        [HttpDelete("permissions/{id}")]
        [ApiMessage("Delete a permission")]
        public async Task<IActionResult> Delete(long id)
        {
            var existing = await _permissionService.FetchByIdAsync(id)
                ?? throw new IdInvalidException($"Permission với id = {id} không tồn tại.");

            await _permissionService.DeleteAsync(id);
            return Ok(null);
        }

        /// <summary>
        /// Fetch permissions with pagination.
        /// Maps from: PermissionController.getPermissions(@Filter Specification, Pageable)
        /// </summary>
        [HttpGet("permissions")]
        [ApiMessage("Fetch permissions")]
        public async Task<IActionResult> GetPermissions([FromQuery] Sieve.Models.SieveModel sieveModel)
        {
            return Ok(await _permissionService.GetPermissionsAsync(sieveModel));
        }
    }
}
