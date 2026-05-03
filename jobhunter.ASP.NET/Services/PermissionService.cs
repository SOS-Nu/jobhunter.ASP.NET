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
    /// Maps from: vn.hoidanit.jobhunter.service.PermissionService
    /// Full CRUD + duplicate detection + pagination
    /// </summary>
    public interface IPermissionService
    {
        Task<bool> IsPermissionExistAsync(string module, string apiPath, string method);
        Task<bool> IsSameNameAsync(long id, string name);
        Task<Permission?> FetchByIdAsync(long id);
        Task<Permission> CreateAsync(Permission p);
        Task<Permission> UpdateAsync(Permission p);
        Task DeleteAsync(long id);
        Task<PaginatedResponse<ResPermissionDTO>> GetPermissionsAsync(SieveModel sieveModel);
    }

    public class PermissionService : IPermissionService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly ISieveProcessor _sieveProcessor;

        public PermissionService(AppDbContext context, IMapper mapper, ISieveProcessor sieveProcessor)
        {
            _context = context;
            _mapper = mapper;
            _sieveProcessor = sieveProcessor;
        }

        /// <summary>
        /// Check if a permission with the same module, apiPath and method already exists.
        /// Maps from: permissionRepository.existsByModuleAndApiPathAndMethod(...)
        /// </summary>
        public async Task<bool> IsPermissionExistAsync(string module, string apiPath, string method)
        {
            return await _context.Permissions.AnyAsync(p =>
                p.Module == module && p.ApiPath == apiPath && p.Method == method);
        }

        /// <summary>
        /// Check if the permission in DB has the same name as the one being updated.
        /// Maps from: PermissionService.isSameName(Permission p)
        /// </summary>
        public async Task<bool> IsSameNameAsync(long id, string name)
        {
            var existing = await _context.Permissions.FindAsync(id);
            return existing != null && existing.Name == name;
        }

        public async Task<Permission?> FetchByIdAsync(long id)
        {
            return await _context.Permissions.FindAsync(id);
        }

        public async Task<Permission> CreateAsync(Permission p)
        {
            _context.Permissions.Add(p);
            await _context.SaveChangesAsync();
            return p;
        }

        /// <summary>
        /// Update a permission by its ID.
        /// Maps from: PermissionService.update(Permission p) - fetches from DB, updates fields, saves.
        /// </summary>
        public async Task<Permission> UpdateAsync(Permission p)
        {
            var permissionDB = await _context.Permissions.FindAsync(p.Id)
                ?? throw new IdInvalidException($"Permission với id = {p.Id} không tồn tại.");

            permissionDB.Name = p.Name;
            permissionDB.ApiPath = p.ApiPath;
            permissionDB.Method = p.Method;
            permissionDB.Module = p.Module;

            await _context.SaveChangesAsync();
            return permissionDB;
        }

        public async Task DeleteAsync(long id)
        {
            var permission = await _context.Permissions
                .Include(p => p.Roles)
                .FirstOrDefaultAsync(p => p.Id == id)
                ?? throw new IdInvalidException($"Permission với id = {id} không tồn tại.");

            // Remove from all roles first (clean many-to-many)
            permission.Roles.Clear();
            _context.Permissions.Remove(permission);
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Paginated permission list with optional name/module filter.
        /// Maps from: PermissionService.getPermissions(Specification, Pageable)
        /// </summary>
        public async Task<PaginatedResponse<ResPermissionDTO>> GetPermissionsAsync(SieveModel sieveModel)
        {
            var query = _context.Permissions.AsQueryable();

            query = _sieveProcessor.Apply(sieveModel, query, applyPagination: false);
            var total = await query.CountAsync();
            var paginatedQuery = _sieveProcessor.Apply(sieveModel, query, applyFiltering: false, applySorting: false, applyPagination: true);
            
            var items = await paginatedQuery
                .Select(p => new ResPermissionDTO
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
                })
                .ToListAsync();

            var page = sieveModel.Page ?? 1;
            var pageSize = sieveModel.PageSize ?? 10;

            return new PaginatedResponse<ResPermissionDTO>
            {
                Meta = new PaginationMeta
                {
                    Page = page,
                    PageSize = pageSize,
                    Pages = (int)Math.Ceiling((double)total / pageSize),
                    Total = total
                },
                Result = items
            };
        }
    }
}
