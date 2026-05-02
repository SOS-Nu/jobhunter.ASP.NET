using AutoMapper;
using Microsoft.EntityFrameworkCore;
using jobhunter.ASP.NET.Data;
using jobhunter.ASP.NET.DTOs.Response;
using jobhunter.ASP.NET.Entities;
using jobhunter.ASP.NET.Enums;
using jobhunter.ASP.NET.Middleware;
using jobhunter.ASP.NET.Models;

namespace jobhunter.ASP.NET.Services
{
    public interface IResumeService
    {
        Task<ResCreateResumeDTO> CreateAsync(Resume resume);
        Task<ResUpdateResumeDTO?> UpdateAsync(long id, ResumeStateEnum? status);
        Task DeleteAsync(long id);
        Task<ResFetchResumeDTO?> GetByIdAsync(long id);
        Task<PaginatedResponse<ResFetchResumeDTO>> GetAllAsync(int page, int pageSize);
        Task<PaginatedResponse<ResFetchResumeDTO>> GetByUserAsync(int page, int pageSize);
    }

    public class ResumeService : IResumeService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly ICurrentUserService _currentUserService;
        private readonly IUserService _userService;

        public ResumeService(AppDbContext context, IMapper mapper, ICurrentUserService currentUserService, IUserService userService)
        {
            _context = context; _mapper = mapper; _currentUserService = currentUserService; _userService = userService;
        }

        public async Task<ResCreateResumeDTO> CreateAsync(Resume resume)
        {
            var email = _currentUserService.GetCurrentUserEmail()
                ?? throw new IdInvalidException("Bạn cần đăng nhập để nộp CV");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email)
                ?? throw new IdInvalidException($"Không tìm thấy người dùng với email: {email}");

            var job = await _context.Jobs.FindAsync(resume.JobId)
                ?? throw new IdInvalidException($"Job với id={resume.JobId} không tồn tại");

            // CV submission limit check (matching Java: canSubmitCv + incrementCvSubmission)
            if (!_userService.CanSubmitCv(email))
            {
                throw new IdInvalidException("Bạn đã đạt giới hạn nộp CV trong tháng này. Nâng cấp VIP để nộp thêm.");
            }

            // Check if already applied - delete old and re-apply (matching Spring Boot logic)
            var existing = await _context.Resumes.FirstOrDefaultAsync(r => r.UserId == user.Id && r.JobId == job.Id);
            if (existing != null) { _context.Resumes.Remove(existing); await _context.SaveChangesAsync(); }

            resume.UserId = user.Id;
            resume.JobId = job.Id;
            resume.Email = email;
            resume.Status = ResumeStateEnum.REVIEWING;

            _context.Resumes.Add(resume);
            await _context.SaveChangesAsync();

            // Increment CV submission count after successful creation
            await _userService.IncrementCvSubmissionAsync(email);

            return _mapper.Map<ResCreateResumeDTO>(resume);
        }

        public async Task<ResUpdateResumeDTO?> UpdateAsync(long id, ResumeStateEnum? status)
        {
            var resume = await _context.Resumes.Include(r => r.Job).FirstOrDefaultAsync(r => r.Id == id);
            if (resume == null) return null;

            resume.Status = status;

            // If APPROVED, decrease job quantity (matching Spring Boot logic)
            if (status == ResumeStateEnum.APPROVED && resume.Job != null)
            {
                if (resume.Job.Quantity > 0)
                {
                    resume.Job.Quantity--;
                    if (resume.Job.Quantity == 0) resume.Job.Active = false;
                }
            }

            await _context.SaveChangesAsync();
            return _mapper.Map<ResUpdateResumeDTO>(resume);
        }

        public async Task DeleteAsync(long id)
        {
            var resume = await _context.Resumes.FindAsync(id);
            if (resume != null) { _context.Resumes.Remove(resume); await _context.SaveChangesAsync(); }
        }

        public async Task<ResFetchResumeDTO?> GetByIdAsync(long id)
        {
            var resume = await _context.Resumes.Include(r => r.User).Include(r => r.Job).ThenInclude(j => j!.Company).FirstOrDefaultAsync(r => r.Id == id);
            if (resume == null) return null;

            var dto = _mapper.Map<ResFetchResumeDTO>(resume);
            // Privacy: only show email if user is public (matching Spring Boot logic)
            if (resume.User != null && !resume.User.IsPublic) dto.Email = null;
            return dto;
        }

        public async Task<PaginatedResponse<ResFetchResumeDTO>> GetAllAsync(int page, int pageSize)
        {
            // Company-scoped access (matching Spring Boot logic)
            var email = _currentUserService.GetCurrentUserEmail();
            if (string.IsNullOrEmpty(email))
                return new PaginatedResponse<ResFetchResumeDTO> { Meta = new PaginationMeta { Page = page, PageSize = pageSize }, Result = new List<ResFetchResumeDTO>() };

            var user = await _context.Users.Include(u => u.Company).FirstOrDefaultAsync(u => u.Email == email);
            if (user?.CompanyId == null)
                return new PaginatedResponse<ResFetchResumeDTO> { Meta = new PaginationMeta { Page = page, PageSize = pageSize }, Result = new List<ResFetchResumeDTO>() };

            var query = _context.Resumes.Include(r => r.User).Include(r => r.Job).ThenInclude(j => j!.Company)
                .Where(r => r.Job != null && r.Job.CompanyId == user.CompanyId);

            var total = await query.CountAsync();
            var items = await query.OrderByDescending(r => r.CreatedAt).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
            var dtos = _mapper.Map<List<ResFetchResumeDTO>>(items);

            return new PaginatedResponse<ResFetchResumeDTO> { Meta = new PaginationMeta { Page = page, PageSize = pageSize, Pages = (int)Math.Ceiling((double)total / pageSize), Total = total }, Result = dtos };
        }

        public async Task<PaginatedResponse<ResFetchResumeDTO>> GetByUserAsync(int page, int pageSize)
        {
            var email = _currentUserService.GetCurrentUserEmail() ?? "";
            var query = _context.Resumes.Include(r => r.User).Include(r => r.Job).ThenInclude(j => j!.Company).Where(r => r.Email == email);
            var total = await query.CountAsync();
            var items = await query.OrderByDescending(r => r.CreatedAt).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
            var dtos = _mapper.Map<List<ResFetchResumeDTO>>(items);
            return new PaginatedResponse<ResFetchResumeDTO> { Meta = new PaginationMeta { Page = page, PageSize = pageSize, Pages = (int)Math.Ceiling((double)total / pageSize), Total = total }, Result = dtos };
        }
    }
}
