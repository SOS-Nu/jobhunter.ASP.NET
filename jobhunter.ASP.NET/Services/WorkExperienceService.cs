using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using jobhunter.ASP.NET.Data;
using jobhunter.ASP.NET.DTOs.Request;
using jobhunter.ASP.NET.DTOs.Response;
using jobhunter.ASP.NET.Entities;
using jobhunter.ASP.NET.Middleware;

namespace jobhunter.ASP.NET.Services
{
    public interface IWorkExperienceService
    {
        Task<ResWorkExperienceDTO> CreateAsync(ReqCreateWorkExperienceDTO dto);
        Task<ResWorkExperienceDTO> UpdateAsync(ReqUpdateWorkExperienceDTO dto);
        Task DeleteAsync(long id);
        Task<List<ResWorkExperienceDTO>> GetMyWorkExperiencesAsync();
    }

    public class WorkExperienceService : IWorkExperienceService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly ICurrentUserService _currentUserService;

        public WorkExperienceService(AppDbContext context, IMapper mapper, ICurrentUserService currentUserService)
        {
            _context = context;
            _mapper = mapper;
            _currentUserService = currentUserService;
        }

        public async Task<ResWorkExperienceDTO> CreateAsync(ReqCreateWorkExperienceDTO dto)
        {
            var currentUser = await GetCurrentUserAsync();

            var workExperience = new WorkExperience
            {
                CompanyName = dto.CompanyName,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Description = dto.Description,
                Location = dto.Location,
                UserId = currentUser.Id
            };

            _context.WorkExperiences.Add(workExperience);
            await _context.SaveChangesAsync();

            return _mapper.Map<ResWorkExperienceDTO>(workExperience);
        }

        public async Task<ResWorkExperienceDTO> UpdateAsync(ReqUpdateWorkExperienceDTO dto)
        {
            var existingExp = await GetOwnedExperienceAsync(dto.Id);

            existingExp.CompanyName = dto.CompanyName;
            existingExp.StartDate = dto.StartDate;
            existingExp.EndDate = dto.EndDate;
            existingExp.Description = dto.Description;
            existingExp.Location = dto.Location;

            await _context.SaveChangesAsync();
            return _mapper.Map<ResWorkExperienceDTO>(existingExp);
        }

        public async Task DeleteAsync(long id)
        {
            var existingExp = await GetOwnedExperienceAsync(id);

            _context.WorkExperiences.Remove(existingExp);
            await _context.SaveChangesAsync();
        }

        public async Task<List<ResWorkExperienceDTO>> GetMyWorkExperiencesAsync()
        {
            var currentUser = await GetCurrentUserAsync();

            return await _context.WorkExperiences
                .Where(w => w.UserId == currentUser.Id)
                .OrderByDescending(w => w.StartDate)
                .ProjectTo<ResWorkExperienceDTO>(_mapper.ConfigurationProvider)
                .ToListAsync();
        }

        // ========================
        // PRIVATE HELPERS
        // ========================

        private async Task<User> GetCurrentUserAsync()
        {
            var email = _currentUserService.GetCurrentUserEmail()
                ?? throw new IdInvalidException("Không tìm thấy người dùng đang đăng nhập");

            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email)
                ?? throw new IdInvalidException("Người dùng không tồn tại");
        }

        /// <summary>
        /// Finds a work experience by ID and verifies the current user owns it.
        /// Replaces the 2x duplicated fetch+ownership-check pattern in Update and Delete.
        /// </summary>
        private async Task<WorkExperience> GetOwnedExperienceAsync(long id)
        {
            var existingExp = await _context.WorkExperiences
                .Include(w => w.User)
                .FirstOrDefaultAsync(w => w.Id == id)
                ?? throw new IdInvalidException($"Không tìm thấy kinh nghiệm làm việc với id: {id}");

            var email = _currentUserService.GetCurrentUserEmail()
                ?? throw new IdInvalidException("Không tìm thấy người dùng đang đăng nhập");

            if (existingExp.User?.Email != email)
                throw new IdInvalidException("Bạn không có quyền thực hiện thao tác này.");

            return existingExp;
        }
    }
}
