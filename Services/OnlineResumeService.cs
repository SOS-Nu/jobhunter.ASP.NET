using Microsoft.EntityFrameworkCore;
using jobhunter.ASP.NET.Data;
using jobhunter.ASP.NET.Entities;
using jobhunter.ASP.NET.Middleware;

namespace jobhunter.ASP.NET.Services
{
    public interface IOnlineResumeService
    {
        Task<OnlineResume> CreateOnlineResumeAsync(OnlineResume resume);
        Task<OnlineResume> UpdateOnlineResumeAsync(OnlineResume resume);
        Task DeleteOnlineResumeAsync();
        Task<OnlineResume?> GetMyOnlineResumeAsync();
    }

    public class OnlineResumeService : IOnlineResumeService
    {
        private readonly AppDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public OnlineResumeService(AppDbContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        public async Task<OnlineResume> CreateOnlineResumeAsync(OnlineResume resume)
        {
            var email = _currentUserService.GetCurrentUserEmail()
                ?? throw new IdInvalidException("Không tìm thấy người dùng đang đăng nhập");
                
            var currentUser = await _context.Users
                .Include(u => u.OnlineResume)
                .FirstOrDefaultAsync(u => u.Email == email)
                ?? throw new IdInvalidException("Người dùng không tồn tại");

            if (currentUser.OnlineResume != null)
            {
                throw new IdInvalidException("Mỗi người dùng chỉ có thể tạo một Online Resume. Bạn đã có, vui lòng chỉnh sửa.");
            }

            if (resume.Skills != null && resume.Skills.Any())
            {
                var skillIds = resume.Skills.Select(s => s.Id).ToList();
                resume.Skills = await _context.Skills.Where(s => skillIds.Contains(s.Id)).ToListAsync();
            }

            _context.OnlineResumes.Add(resume);
            await _context.SaveChangesAsync();
            
            currentUser.OnlineResumeId = resume.Id;
            currentUser.OnlineResume = resume;
            
            await _context.SaveChangesAsync();
            return resume;
        }

        public async Task<OnlineResume> UpdateOnlineResumeAsync(OnlineResume resume)
        {
            var email = _currentUserService.GetCurrentUserEmail()
                ?? throw new IdInvalidException("Không tìm thấy người dùng đang đăng nhập");
                
            var currentUser = await _context.Users
                .Include(u => u.OnlineResume)
                .FirstOrDefaultAsync(u => u.Email == email)
                ?? throw new IdInvalidException("Người dùng không tồn tại");

            if (currentUser.OnlineResume == null)
            {
                throw new IdInvalidException("Bạn chưa có Online Resume để cập nhật.");
            }

            if (currentUser.OnlineResume.Id != resume.Id)
            {
                throw new IdInvalidException("Bạn không có quyền chỉnh sửa Online Resume này.");
            }

            var existingResume = await _context.OnlineResumes
                .Include(r => r.Skills)
                .FirstOrDefaultAsync(r => r.Id == resume.Id)
                ?? throw new IdInvalidException($"Không tìm thấy Online Resume với id: {resume.Id}");

            existingResume.Title = resume.Title;
            existingResume.FullName = resume.FullName;
            existingResume.Email = resume.Email;
            existingResume.Phone = resume.Phone;
            existingResume.Address = resume.Address;
            existingResume.Summary = resume.Summary;
            existingResume.Certifications = resume.Certifications;
            existingResume.Educations = resume.Educations;
            existingResume.Languages = resume.Languages;

            if (resume.Skills != null && resume.Skills.Any())
            {
                var skillIds = resume.Skills.Select(s => s.Id).ToList();
                var dbSkills = await _context.Skills.Where(s => skillIds.Contains(s.Id)).ToListAsync();
                
                existingResume.Skills.Clear();
                foreach (var skill in dbSkills)
                {
                    existingResume.Skills.Add(skill);
                }
            }
            else
            {
                existingResume.Skills.Clear();
            }

            await _context.SaveChangesAsync();
            return existingResume;
        }

        public async Task DeleteOnlineResumeAsync()
        {
            var email = _currentUserService.GetCurrentUserEmail()
                ?? throw new IdInvalidException("Không tìm thấy người dùng đang đăng nhập");
                
            var currentUser = await _context.Users
                .Include(u => u.OnlineResume)
                .FirstOrDefaultAsync(u => u.Email == email)
                ?? throw new IdInvalidException("Người dùng không tồn tại");

            if (currentUser.OnlineResume == null)
            {
                throw new IdInvalidException("Bạn không có Online Resume để xóa.");
            }

            var resumeIdToDelete = currentUser.OnlineResume.Id;
            currentUser.OnlineResume = null;
            
            var resume = await _context.OnlineResumes.FindAsync(resumeIdToDelete);
            if (resume != null)
            {
                _context.OnlineResumes.Remove(resume);
            }
            
            await _context.SaveChangesAsync();
        }

        public async Task<OnlineResume?> GetMyOnlineResumeAsync()
        {
            var email = _currentUserService.GetCurrentUserEmail()
                ?? throw new IdInvalidException("Không tìm thấy người dùng đang đăng nhập");
                
            var currentUser = await _context.Users
                .Include(u => u.OnlineResume)
                .FirstOrDefaultAsync(u => u.Email == email)
                ?? throw new IdInvalidException("Người dùng không tồn tại");

            if (currentUser.OnlineResume == null)
            {
                return null;
            }

            return await _context.OnlineResumes
                .Include(r => r.Skills)
                .FirstOrDefaultAsync(r => r.Id == currentUser.OnlineResume.Id);
        }
    }
}
