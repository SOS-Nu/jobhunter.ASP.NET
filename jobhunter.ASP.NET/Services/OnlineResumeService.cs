using AutoMapper;
using Microsoft.EntityFrameworkCore;
using jobhunter.ASP.NET.Data;
using jobhunter.ASP.NET.DTOs.Request;
using jobhunter.ASP.NET.DTOs.Response;
using jobhunter.ASP.NET.Entities;
using jobhunter.ASP.NET.Middleware;

namespace jobhunter.ASP.NET.Services
{
    public interface IOnlineResumeService
    {
        Task<ResOnlineResumeDTO> CreateAsync(ReqCreateOnlineResumeDTO dto);
        Task<ResOnlineResumeDTO> UpdateAsync(ReqUpdateOnlineResumeDTO dto);
        Task DeleteAsync();
        Task<ResOnlineResumeDTO?> GetMyResumeAsync();
    }

    public class OnlineResumeService : IOnlineResumeService
    {
        private readonly AppDbContext _context;
        private readonly ICurrentUserService _currentUserService;
        private readonly IMapper _mapper;

        public OnlineResumeService(AppDbContext context, ICurrentUserService currentUserService, IMapper mapper)
        {
            _context = context;
            _currentUserService = currentUserService;
            _mapper = mapper;
        }

        public async Task<ResOnlineResumeDTO> CreateAsync(ReqCreateOnlineResumeDTO dto)
        {
            var currentUser = await GetCurrentUserWithResumeAsync();

            if (currentUser.OnlineResume != null)
            {
                throw new IdInvalidException("Mỗi người dùng chỉ có thể tạo một Online Resume. Bạn đã có, vui lòng chỉnh sửa.");
            }

            var resume = new OnlineResume
            {
                Title = dto.Title,
                FullName = dto.FullName,
                Email = dto.Email,
                Phone = dto.Phone,
                Address = dto.Address,
                Summary = dto.Summary,
                Certifications = dto.Certifications,
                Educations = dto.Educations,
                Languages = dto.Languages,
                Skills = await ResolveSkillsAsync(dto.Skills)
            };

            _context.OnlineResumes.Add(resume);
            await _context.SaveChangesAsync();

            currentUser.OnlineResumeId = resume.Id;
            await _context.SaveChangesAsync();

            return _mapper.Map<ResOnlineResumeDTO>(resume);
        }

        public async Task<ResOnlineResumeDTO> UpdateAsync(ReqUpdateOnlineResumeDTO dto)
        {
            var currentUser = await GetCurrentUserWithResumeAsync();

            if (currentUser.OnlineResume == null)
                throw new IdInvalidException("Bạn chưa có Online Resume để cập nhật.");

            if (currentUser.OnlineResume.Id != dto.Id)
                throw new IdInvalidException("Bạn không có quyền chỉnh sửa Online Resume này.");

            var existingResume = await _context.OnlineResumes
                .Include(r => r.Skills)
                .FirstOrDefaultAsync(r => r.Id == dto.Id)
                ?? throw new IdInvalidException($"Không tìm thấy Online Resume với id: {dto.Id}");

            existingResume.Title = dto.Title;
            existingResume.FullName = dto.FullName;
            existingResume.Email = dto.Email;
            existingResume.Phone = dto.Phone;
            existingResume.Address = dto.Address;
            existingResume.Summary = dto.Summary;
            existingResume.Certifications = dto.Certifications;
            existingResume.Educations = dto.Educations;
            existingResume.Languages = dto.Languages;

            existingResume.Skills.Clear();
            foreach (var skill in await ResolveSkillsAsync(dto.Skills))
            {
                existingResume.Skills.Add(skill);
            }

            await _context.SaveChangesAsync();
            return _mapper.Map<ResOnlineResumeDTO>(existingResume);
        }

        public async Task DeleteAsync()
        {
            var currentUser = await GetCurrentUserWithResumeAsync();

            if (currentUser.OnlineResume == null)
                throw new IdInvalidException("Bạn không có Online Resume để xóa.");

            var resumeId = currentUser.OnlineResume.Id;
            currentUser.OnlineResumeId = null;

            var resume = await _context.OnlineResumes.FindAsync(resumeId);
            if (resume != null)
                _context.OnlineResumes.Remove(resume);

            await _context.SaveChangesAsync();
        }

        public async Task<ResOnlineResumeDTO?> GetMyResumeAsync()
        {
            var currentUser = await GetCurrentUserWithResumeAsync();

            if (currentUser.OnlineResume == null)
                return null;

            var resume = await _context.OnlineResumes
                .Include(r => r.Skills)
                .FirstOrDefaultAsync(r => r.Id == currentUser.OnlineResume.Id);

            return resume != null ? _mapper.Map<ResOnlineResumeDTO>(resume) : null;
        }

        // ========================
        // PRIVATE HELPERS
        // ========================

        private async Task<User> GetCurrentUserWithResumeAsync()
        {
            var email = _currentUserService.GetCurrentUserEmail()
                ?? throw new IdInvalidException("Không tìm thấy người dùng đang đăng nhập");

            return await _context.Users
                .Include(u => u.OnlineResume)
                .FirstOrDefaultAsync(u => u.Email == email)
                ?? throw new IdInvalidException("Người dùng không tồn tại");
        }

        private async Task<List<Skill>> ResolveSkillsAsync(List<SkillRef>? skillRefs)
        {
            if (skillRefs == null || !skillRefs.Any())
                return new List<Skill>();

            var skillIds = skillRefs.Select(s => s.Id).ToList();
            return await _context.Skills.Where(s => skillIds.Contains(s.Id)).ToListAsync();
        }
    }
}
