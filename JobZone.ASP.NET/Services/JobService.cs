using AutoMapper;
using Microsoft.EntityFrameworkCore;
using JobZone.ASP.NET.Data;
using JobZone.ASP.NET.DTOs.Request;
using JobZone.ASP.NET.DTOs.Response;
using JobZone.ASP.NET.Entities;
using JobZone.ASP.NET.Middleware;
using JobZone.ASP.NET.Models;
using Sieve.Models;
using Sieve.Services;

namespace JobZone.ASP.NET.Services
{
    public interface IJobService
    {
        Task<ResCreateJobDTO> CreateAsync(ReqCreateJobDTO dto);
        Task<ResUpdateJobDTO?> UpdateAsync(Job job);
        Task DeleteAsync(long id);
        Task<ResFetchJobDTO?> GetByIdAsync(long id);
        Task<PaginatedResponse<ResFetchJobDTO>> GetAllAsync(SieveModel sieveModel);
        Task<PaginatedResponse<ResFetchJobDTO>> GetByCompanyAsync(long companyId, SieveModel sieveModel);
        Task<ResCreateJobDTO> CreateForUserCompanyAsync(DTOs.Request.ReqCreateJobDTO dto);
        Task<ResUpdateJobDTO> UpdateForUserCompanyAsync(DTOs.Request.ReqUpdateJobDTO dto);
        Task DeleteForUserCompanyAsync(long id);
    }

    public class JobService : IJobService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly ICurrentUserService _currentUserService;
        private readonly ISieveProcessor _sieveProcessor;

        public JobService(AppDbContext context, IMapper mapper, ICurrentUserService currentUserService, ISieveProcessor sieveProcessor)
        {
            _context = context; _mapper = mapper; _currentUserService = currentUserService; _sieveProcessor = sieveProcessor;
        }

        public async Task<ResCreateJobDTO> CreateAsync(ReqCreateJobDTO dto)
        {
            var job = _mapper.Map<Job>(dto);

            // Handle Company relationship by FK to avoid EF tracking issues
            if (dto.Company != null)
            {
                job.CompanyId = dto.Company.Id;
                job.Company = null;
            }

            // Resolve Skill references from DB by their IDs
            if (dto.Skills != null && dto.Skills.Any())
            {
                var skillIds = dto.Skills.Select(s => s.Id).ToList();
                job.Skills = await _context.Skills.Where(s => skillIds.Contains(s.Id)).ToListAsync();
            }

            job.CreatedAt = DateTime.UtcNow;

            _context.Jobs.Add(job);
            await _context.SaveChangesAsync();
            return _mapper.Map<ResCreateJobDTO>(job);
        }

        public async Task<ResUpdateJobDTO?> UpdateAsync(Job j)
        {
            var existing = await _context.Jobs.Include(x => x.Skills).FirstOrDefaultAsync(x => x.Id == j.Id);
            if (existing == null) return null;

            if (j.Skills != null)
            {
                var ids = j.Skills.Select(s => s.Id).ToList();
                existing.Skills = await _context.Skills.Where(s => ids.Contains(s.Id)).ToListAsync();
            }
            if (j.CompanyId.HasValue)
            {
                var comp = await _context.Companies.FindAsync(j.CompanyId.Value);
                if (comp != null) existing.CompanyId = comp.Id;
            }

            existing.Name = j.Name; existing.Salary = j.Salary; existing.Quantity = j.Quantity;
            existing.Location = j.Location; existing.Level = j.Level; existing.StartDate = j.StartDate;
            existing.EndDate = j.EndDate; existing.Active = j.Active; existing.Address = j.Address;

            await _context.SaveChangesAsync();
            return _mapper.Map<ResUpdateJobDTO>(existing);
        }

        public async Task DeleteAsync(long id)
        {
            var job = await _context.Jobs.FindAsync(id);
            if (job != null) { _context.Jobs.Remove(job); await _context.SaveChangesAsync(); }
        }

        public async Task<ResFetchJobDTO?> GetByIdAsync(long id)
        {
            var job = await _context.Jobs.Include(j => j.Company).Include(j => j.Skills).FirstOrDefaultAsync(j => j.Id == id);
            if (job == null) return null;
            var dto = _mapper.Map<ResFetchJobDTO>(job);

            // Check if current user has applied to this job (matching Java: fetchJobDetail isApplied logic)
            var email = _currentUserService.GetCurrentUserEmail();
            if (!string.IsNullOrEmpty(email))
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
                if (user != null)
                {
                    dto.IsApplied = await _context.Resumes.AnyAsync(r => r.UserId == user.Id && r.JobId == id);
                }
            }

            return dto;
        }

        public async Task<PaginatedResponse<ResFetchJobDTO>> GetAllAsync(SieveModel sieveModel)
        {
            var query = _context.Jobs.Include(j => j.Company).Include(j => j.Skills).AsQueryable();

            // SUPER_ADMIN sees all jobs including inactive (matching Java: fetchAll security-based filtering)
            var email = _currentUserService.GetCurrentUserEmail();
            bool isSuperAdmin = false;
            long? currentUserId = null;

            if (!string.IsNullOrEmpty(email))
            {
                var user = await _context.Users
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u => u.Email == email);
                if (user?.Role?.Name == "SUPER_ADMIN")
                {
                    isSuperAdmin = true;
                }
                currentUserId = user?.Id;
            }

            if (!isSuperAdmin)
            {
                query = query.Where(j => j.Active);
            }

            // Apply Sieve filtering and sorting (before pagination to get total count)
            query = _sieveProcessor.Apply(sieveModel, query, applyPagination: false);

            var total = await query.CountAsync();
            
            // Apply Sieve pagination
            var paginatedQuery = _sieveProcessor.Apply(sieveModel, query, applyFiltering: false, applySorting: false, applyPagination: true);

            var items = await paginatedQuery.ToListAsync();
            var dtos = _mapper.Map<List<ResFetchJobDTO>>(items);

            // Set isApplied flag for each job if user is logged in (matching Java logic)
            if (currentUserId.HasValue)
            {
                var jobIds = items.Select(j => j.Id).ToList();
                var appliedJobIds = await _context.Resumes
                    .Where(r => r.UserId == currentUserId.Value && jobIds.Contains(r.JobId ?? 0))
                    .Select(r => r.JobId)
                    .ToListAsync();

                foreach (var dto in dtos)
                {
                    dto.IsApplied = appliedJobIds.Contains(dto.Id);
                }
            }

            var page = sieveModel.Page ?? 1;
            var pageSize = sieveModel.PageSize ?? 10;
            return new PaginatedResponse<ResFetchJobDTO> { Meta = new PaginationMeta { Page = page, PageSize = pageSize, Pages = (int)Math.Ceiling((double)total / pageSize), Total = total }, Result = dtos };
        }

        public async Task<PaginatedResponse<ResFetchJobDTO>> GetByCompanyAsync(long companyId, SieveModel sieveModel)
        {
            var query = _context.Jobs.Include(j => j.Company).Include(j => j.Skills).Where(j => j.CompanyId == companyId && j.Active).AsQueryable();
            
            // Apply Sieve filtering and sorting
            query = _sieveProcessor.Apply(sieveModel, query, applyPagination: false);
            var total = await query.CountAsync();
            
            // Apply Sieve pagination
            var paginatedQuery = _sieveProcessor.Apply(sieveModel, query, applyFiltering: false, applySorting: false, applyPagination: true);
            var items = await paginatedQuery.ToListAsync();

            var page = sieveModel.Page ?? 1;
            var pageSize = sieveModel.PageSize ?? 10;
            return new PaginatedResponse<ResFetchJobDTO> { Meta = new PaginationMeta { Page = page, PageSize = pageSize, Pages = (int)Math.Ceiling((double)total / pageSize), Total = total }, Result = _mapper.Map<List<ResFetchJobDTO>>(items) };
        }

        public async Task<ResCreateJobDTO> CreateForUserCompanyAsync(DTOs.Request.ReqCreateJobDTO dto)
        {
            var email = _currentUserService.GetCurrentUserEmail() ?? throw new IdInvalidException("Không tìm thấy người dùng");
            var user = await _context.Users.Include(u => u.Company).FirstOrDefaultAsync(u => u.Email == email) ?? throw new IdInvalidException("Người dùng không tồn tại");
            if (!user.IsVip) throw new IdInvalidException("Bạn cần là tài khoản VIP để tạo công việc");
            if (user.CompanyId == null) throw new IdInvalidException("Người dùng không thuộc công ty nào");

            var job = new Job { Name = dto.Name, Location = dto.Location, Address = dto.Address, Salary = dto.Salary, Quantity = dto.Quantity, Level = dto.Level, Description = dto.Description, StartDate = dto.StartDate, EndDate = dto.EndDate, Active = dto.Active, CompanyId = user.CompanyId };

            if (dto.Skills != null && dto.Skills.Any())
            {
                var ids = dto.Skills.Select(s => s.Id).ToList();
                job.Skills = await _context.Skills.Where(s => ids.Contains(s.Id)).ToListAsync();
                if (job.Skills.Count != ids.Count) throw new IdInvalidException("Một hoặc nhiều kỹ năng không tồn tại");
            }

            _context.Jobs.Add(job);
            await _context.SaveChangesAsync();
            return _mapper.Map<ResCreateJobDTO>(job);
        }

        public async Task<ResUpdateJobDTO> UpdateForUserCompanyAsync(DTOs.Request.ReqUpdateJobDTO dto)
        {
            var email = _currentUserService.GetCurrentUserEmail() ?? throw new IdInvalidException("Không tìm thấy người dùng");
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email) ?? throw new IdInvalidException("Người dùng không tồn tại");
            if (user.CompanyId == null) throw new IdInvalidException("Người dùng không thuộc công ty nào");

            var job = await _context.Jobs.Include(j => j.Skills).FirstOrDefaultAsync(j => j.Id == dto.Id) ?? throw new IdInvalidException($"Công việc với id = {dto.Id} không tồn tại");
            if (job.CompanyId != user.CompanyId) throw new IdInvalidException("Bạn không có quyền cập nhật công việc này");

            job.Name = dto.Name; job.Location = dto.Location; job.Address = dto.Address; job.Salary = dto.Salary;
            job.Quantity = dto.Quantity; job.Level = dto.Level; job.Description = dto.Description;
            job.StartDate = dto.StartDate; job.EndDate = dto.EndDate; job.Active = dto.Active;

            if (dto.Skills != null && dto.Skills.Any())
            {
                var ids = dto.Skills.Select(s => s.Id).ToList();
                job.Skills = await _context.Skills.Where(s => ids.Contains(s.Id)).ToListAsync();
            }
            else { job.Skills?.Clear(); }

            await _context.SaveChangesAsync();
            return _mapper.Map<ResUpdateJobDTO>(job);
        }

        public async Task DeleteForUserCompanyAsync(long id)
        {
            var email = _currentUserService.GetCurrentUserEmail() ?? throw new IdInvalidException("Không tìm thấy người dùng");
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email) ?? throw new IdInvalidException("Người dùng không tồn tại");
            if (user.CompanyId == null) throw new IdInvalidException("Người dùng không thuộc công ty nào");
            var job = await _context.Jobs.FindAsync(id) ?? throw new IdInvalidException($"Công việc với id = {id} không tồn tại");
            if (job.CompanyId != user.CompanyId) throw new IdInvalidException("Bạn không có quyền xóa công việc này");
            _context.Jobs.Remove(job);
            await _context.SaveChangesAsync();
        }
    }
}
