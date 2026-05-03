using AutoMapper;
using Microsoft.EntityFrameworkCore;
using jobhunter.ASP.NET.Data;
using jobhunter.ASP.NET.DTOs.Response;
using jobhunter.ASP.NET.Entities;
using jobhunter.ASP.NET.Middleware;
using jobhunter.ASP.NET.Models;
using Sieve.Models;
using Sieve.Services;

namespace jobhunter.ASP.NET.Services
{
    /// <summary>
    /// Maps from: vn.hoidanit.jobhunter.service.RoleService
    /// Full CRUD with permission resolution + pagination.
    /// Uses projection to avoid returning raw entities (per agents.md DTO rules).
    /// </summary>
    public interface IRoleService
    {
        Task<ResRoleDTO?> FetchByIdAsync(long id);
        Task<bool> ExistByNameAsync(string name);
        Task<ResRoleDTO> CreateAsync(Role r);
        Task<ResRoleDTO> UpdateAsync(Role r);
        Task DeleteAsync(long id);
        Task<PaginatedResponse<ResRoleDTO>> GetRolesAsync(SieveModel sieveModel);
    }

    public class RoleService : IRoleService
    {
        private readonly AppDbContext _context;
        private readonly ISieveProcessor _sieveProcessor;

        public RoleService(AppDbContext context, ISieveProcessor sieveProcessor)
        {
            _context = context;
            _sieveProcessor = sieveProcessor;
        }

        /// <summary>
        /// Fetch role with permissions by ID, projected to DTO.
        /// Maps from: roleRepository.findOneWithPermissionsById(id).map(roleMapper::toDto)
        /// Zero N+1: Single query with Include + projection.
        /// </summary>
        public async Task<ResRoleDTO?> FetchByIdAsync(long id)
        {
            var role = await _context.Roles
                .Include(r => r.Permissions)
                .FirstOrDefaultAsync(r => r.Id == id);

            return role != null ? MapToDto(role) : null;
        }

        public async Task<bool> ExistByNameAsync(string name)
        {
            return await _context.Roles.AnyAsync(r => r.Name == name);
        }

        /// <summary>
        /// Create a role and resolve permission IDs from DB.
        /// Maps from: RoleService.create(Role r) - fetches permissions by IDs, sets them, saves.
        /// </summary>
        public async Task<ResRoleDTO> CreateAsync(Role r)
        {
            // Resolve permissions from DB by their IDs (matching Java: permissionRepository.findByIdIn(...))
            if (r.Permissions != null && r.Permissions.Any())
            {
                var permissionIds = r.Permissions.Select(p => p.Id).ToList();
                var dbPermissions = await _context.Permissions
                    .Where(p => permissionIds.Contains(p.Id))
                    .ToListAsync();
                r.Permissions = dbPermissions;
            }
            else
            {
                r.Permissions = new List<Permission>();
            }

            _context.Roles.Add(r);
            await _context.SaveChangesAsync();
            return MapToDto(r);
        }

        /// <summary>
        /// Update role name, description, active status and re-resolve permissions.
        /// Maps from: RoleService.update(Role r)
        /// </summary>
        public async Task<ResRoleDTO> UpdateAsync(Role r)
        {
            var roleDB = await _context.Roles
                .Include(role => role.Permissions)
                .FirstOrDefaultAsync(role => role.Id == r.Id)
                ?? throw new IdInvalidException($"Role với id = {r.Id} không tồn tại");

            roleDB.Name = r.Name;
            roleDB.Description = r.Description;
            roleDB.Active = r.Active;

            // Re-resolve permissions
            if (r.Permissions != null && r.Permissions.Any())
            {
                var permissionIds = r.Permissions.Select(p => p.Id).ToList();
                var dbPermissions = await _context.Permissions
                    .Where(p => permissionIds.Contains(p.Id))
                    .ToListAsync();
                roleDB.Permissions.Clear();
                foreach (var p in dbPermissions)
                {
                    roleDB.Permissions.Add(p);
                }
            }
            else
            {
                roleDB.Permissions.Clear();
            }

            await _context.SaveChangesAsync();
            return MapToDto(roleDB);
        }

        public async Task DeleteAsync(long id)
        {
            var role = await _context.Roles
                .Include(r => r.Permissions)
                .FirstOrDefaultAsync(r => r.Id == id)
                ?? throw new IdInvalidException($"Role với id = {id} không tồn tại");

            role.Permissions.Clear();
            _context.Roles.Remove(role);
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Paginated role list with permissions, projected to DTOs.
        /// Maps from: RoleService.getRoles(Specification, Pageable) 
        /// Uses .Select() projection to avoid N+1 on permissions.
        /// </summary>
        public async Task<PaginatedResponse<ResRoleDTO>> GetRolesAsync(SieveModel sieveModel)
        {
            var query = _context.Roles.Include(r => r.Permissions).AsQueryable();

            query = _sieveProcessor.Apply(sieveModel, query, applyPagination: false);
            var total = await query.CountAsync();
            var paginatedQuery = _sieveProcessor.Apply(sieveModel, query, applyFiltering: false, applySorting: false, applyPagination: true);
            var items = await paginatedQuery.ToListAsync();

            var dtos = items.Select(MapToDto).ToList();

            var page = sieveModel.Page ?? 1;
            var pageSize = sieveModel.PageSize ?? 10;

            return new PaginatedResponse<ResRoleDTO>
            {
                Meta = new PaginationMeta
                {
                    Page = page,
                    PageSize = pageSize,
                    Pages = (int)Math.Ceiling((double)total / pageSize),
                    Total = total
                },
                Result = dtos
            };
        }

        /// <summary>
        /// Maps Role entity to ResRoleDTO with flattened permissions.
        /// Replaces Java's RoleMapper + PermissionMapper (MapStruct).
        /// Handles circular reference by explicitly flattening (per agents.md: no IgnoreCycles reliance).
        /// </summary>
        private static ResRoleDTO MapToDto(Role role)
        {
            return new ResRoleDTO
            {
                Id = role.Id,
                Name = role.Name,
                Description = role.Description,
                Active = role.Active,
                CreatedAt = role.CreatedAt,
                UpdatedAt = role.UpdatedAt,
                CreatedBy = role.CreatedBy,
                UpdatedBy = role.UpdatedBy,
                Permissions = role.Permissions?.Select(p => new ResPermissionDTO
                {
                    Id = p.Id,
                    Name = p.Name,
                    ApiPath = p.ApiPath,
                    Method = p.Method,
                    Module = p.Module,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,
                    CreatedBy = p.CreatedBy,
                    UpdatedBy = p.UpdatedBy
                }).ToList() ?? new List<ResPermissionDTO>()
            };
        }
    }
}
