using AutoMapper;
using Microsoft.EntityFrameworkCore;
using jobhunter.ASP.NET.Data;
using jobhunter.ASP.NET.DTOs.Response;
using jobhunter.ASP.NET.Entities;
using jobhunter.ASP.NET.Middleware;
using jobhunter.ASP.NET.Models;

namespace jobhunter.ASP.NET.Services
{
    public interface IJobService
    {
        Task<ResCreateJobDTO> CreateAsync(Job job);
        Task<ResUpdateJobDTO?> UpdateAsync(Job job);
        Task DeleteAsync(long id);
        Task<ResFetchJobDTO?> GetByIdAsync(long id);
        Task<PaginatedResponse<ResFetchJobDTO>> GetAllAsync(int page, int pageSize, string? filter);
        Task<PaginatedResponse<ResFetchJobDTO>> GetByCompanyAsync(long companyId, int page, int pageSize);
        Task<ResCreateJobDTO> CreateForUserCompanyAsync(DTOs.Request.ReqCreateJobDTO dto);
        Task<ResUpdateJobDTO> UpdateForUserCompanyAsync(DTOs.Request.ReqUpdateJobDTO dto);
        Task DeleteForUserCompanyAsync(long id);
    }

    public class JobService : IJobService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly ICurrentUserService _currentUserService;

        public JobService(AppDbContext context, IMapper mapper, ICurrentUserService currentUserService)
        {
            _context = context; _mapper = mapper; _currentUserService = currentUserService;
        }

        public async Task<ResCreateJobDTO> CreateAsync(Job j)
        {
            if (j.Skills != null && j.Skills.Any())
            {
                var skillIds = j.Skills.Select(s => s.Id).ToList();
                j.Skills = await _context.Skills.Where(s => skillIds.Contains(s.Id)).ToListAsync();
            }
            _context.Jobs.Add(j);
            await _context.SaveChangesAsync();
            return _mapper.Map<ResCreateJobDTO>(j);
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

        public async Task<PaginatedResponse<ResFetchJobDTO>> GetAllAsync(int page, int pageSize, string? filter)
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

            if (!string.IsNullOrEmpty(filter))
                query = query.Where(j => j.Name.Contains(filter) || j.Location.Contains(filter));

            var total = await query.CountAsync();
            var items = await query.OrderByDescending(j => j.CreatedAt).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
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

            return new PaginatedResponse<ResFetchJobDTO> { Meta = new PaginationMeta { Page = page, PageSize = pageSize, Pages = (int)Math.Ceiling((double)total / pageSize), Total = total }, Result = dtos };
        }

        public async Task<PaginatedResponse<ResFetchJobDTO>> GetByCompanyAsync(long companyId, int page, int pageSize)
        {
            var query = _context.Jobs.Include(j => j.Company).Include(j => j.Skills).Where(j => j.CompanyId == companyId && j.Active);
            var total = await query.CountAsync();
            var items = await query.OrderByDescending(j => j.CreatedAt).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
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
