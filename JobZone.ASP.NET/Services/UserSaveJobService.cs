using AutoMapper;
using Microsoft.EntityFrameworkCore;
using JobZone.ASP.NET.Data;
using JobZone.ASP.NET.DTOs.Response;
using JobZone.ASP.NET.Entities;
using JobZone.ASP.NET.Middleware;
using Sieve.Models;
using Sieve.Services;
using JobZone.ASP.NET.Models;

namespace JobZone.ASP.NET.Services
{
    public interface IUserSaveJobService
    {
        Task<ResSaveJobDTO> SaveJobAsync(long jobId);
        Task UnsaveJobAsync(long jobId);
        Task<PaginatedResponse<ResSaveJobDTO>> GetSavedJobsAsync(SieveModel sieveModel);
        Task<bool> IsJobSavedAsync(long jobId);
    }

    public class UserSaveJobService : IUserSaveJobService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly ICurrentUserService _currentUserService;
        private readonly ISieveProcessor _sieveProcessor;

        public UserSaveJobService(AppDbContext context, IMapper mapper, ICurrentUserService currentUserService, ISieveProcessor sieveProcessor)
        {
            _context = context;
            _mapper = mapper;
            _currentUserService = currentUserService;
            _sieveProcessor = sieveProcessor;
        }

        public async Task<ResSaveJobDTO> SaveJobAsync(long jobId)
        {
            var email = _currentUserService.GetCurrentUserEmail() ?? throw new IdInvalidException("Không tìm thấy người dùng");
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email) ?? throw new IdInvalidException("Người dùng không tồn tại");

            var job = await _context.Jobs.FindAsync(jobId) ?? throw new IdInvalidException("Công việc không tồn tại");

            var existing = await _context.UserSaveJobs.FirstOrDefaultAsync(x => x.UserId == user.Id && x.JobId == jobId);
            if (existing != null) throw new IdInvalidException("Bạn đã lưu công việc này rồi");

            var saveJob = new UserSaveJob
            {
                UserId = user.Id,
                JobId = jobId,
                CreatedAt = DateTime.UtcNow
            };

            _context.UserSaveJobs.Add(saveJob);
            await _context.SaveChangesAsync();

            var res = _mapper.Map<ResSaveJobDTO>(saveJob);
            res.JobName = job.Name;
            // Optionally load company name
            var company = await _context.Companies.FindAsync(job.CompanyId);
            res.CompanyName = company?.Name;

            return res;
        }

        public async Task UnsaveJobAsync(long jobId)
        {
            var email = _currentUserService.GetCurrentUserEmail() ?? throw new IdInvalidException("Không tìm thấy người dùng");
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email) ?? throw new IdInvalidException("Người dùng không tồn tại");

            var existing = await _context.UserSaveJobs.FirstOrDefaultAsync(x => x.UserId == user.Id && x.JobId == jobId);
            if (existing != null)
            {
                _context.UserSaveJobs.Remove(existing);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<PaginatedResponse<ResSaveJobDTO>> GetSavedJobsAsync(SieveModel sieveModel)
        {
            var email = _currentUserService.GetCurrentUserEmail() ?? throw new IdInvalidException("Không tìm thấy người dùng");
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email) ?? throw new IdInvalidException("Người dùng không tồn tại");

            var query = _context.UserSaveJobs
                .Include(x => x.Job)
                .ThenInclude(j => j.Company)
                .Where(x => x.UserId == user.Id)
                .AsQueryable();

            query = _sieveProcessor.Apply(sieveModel, query, applyPagination: false);
            var total = await query.CountAsync();
            var paginatedQuery = _sieveProcessor.Apply(sieveModel, query, applyFiltering: false, applySorting: false, applyPagination: true);

            var items = await paginatedQuery.ToListAsync();
            var dtos = items.Select(x => new ResSaveJobDTO
            {
                Id = x.Id,
                JobId = x.JobId,
                JobName = x.Job.Name,
                CompanyName = x.Job.Company?.Name,
                CreatedAt = x.CreatedAt
            }).ToList();

            var page = sieveModel.Page ?? 1;
            var pageSize = sieveModel.PageSize ?? 10;

            return new PaginatedResponse<ResSaveJobDTO>
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

        public async Task<bool> IsJobSavedAsync(long jobId)
        {
            var email = _currentUserService.GetCurrentUserEmail();
            if (string.IsNullOrEmpty(email)) return false;

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null) return false;

            return await _context.UserSaveJobs.AnyAsync(x => x.UserId == user.Id && x.JobId == jobId);
        }
    }
}
