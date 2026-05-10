using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using JobZone.ASP.NET.Hubs;
using JobZone.ASP.NET.Data;
using JobZone.ASP.NET.DTOs.Response;
using JobZone.ASP.NET.Entities;
using JobZone.ASP.NET.Enums;
using JobZone.ASP.NET.Middleware;
using JobZone.ASP.NET.Models;
using Sieve.Models;
using Sieve.Services;

namespace JobZone.ASP.NET.Services
{
    public interface IResumeService
    {
        Task<ResCreateResumeDTO> CreateAsync(Resume resume);
        Task<ResUpdateResumeDTO?> UpdateAsync(long id, ResumeStateEnum? status, string? url = null, string? coverLetter = null);
        Task DeleteAsync(long id);
        Task<ResFetchResumeDTO?> GetByIdAsync(long id);
        Task<PaginatedResponse<ResFetchResumeDTO>> GetAllAsync(SieveModel sieveModel);
        Task<PaginatedResponse<ResFetchResumeDTO>> GetByUserAsync(SieveModel sieveModel);
        Task NotifyUserAfterApprovedAsync(long id);
    }

    public class ResumeService : IResumeService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly ICurrentUserService _currentUserService;
        private readonly IUserService _userService;
        private readonly ISieveProcessor _sieveProcessor;
        private readonly IEmailService _emailService;
        private readonly IChatService _chatService;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly IGeminiService _geminiService;
        private readonly ILogger<ResumeService> _logger;

        public ResumeService(
            AppDbContext context, 
            IMapper mapper, 
            ICurrentUserService currentUserService, 
            IUserService userService, 
            ISieveProcessor sieveProcessor,
            IEmailService emailService, 
            IChatService chatService, 
            IHubContext<ChatHub> hubContext,
            IGeminiService geminiService,
            ILogger<ResumeService> logger)
        {
            _context = context; 
            _mapper = mapper; 
            _currentUserService = currentUserService; 
            _userService = userService; 
            _sieveProcessor = sieveProcessor;
            _emailService = emailService; 
            _chatService = chatService; 
            _hubContext = hubContext;
            _geminiService = geminiService;
            _logger = logger;
        }

        public async Task<ResCreateResumeDTO> CreateAsync(Resume resume)
        {
            var email = _currentUserService.GetCurrentUserEmail()
                ?? throw new IdInvalidException("Bạn cần đăng nhập để nộp CV");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email)
                ?? throw new IdInvalidException($"Không tìm thấy người dùng với email: {email}");

            var job = await _context.Jobs.FindAsync(resume.JobId)
                ?? throw new IdInvalidException($"Job với id={resume.JobId} không tồn tại");

            // CV submission limit check
            if (!_userService.CanSubmitCv(email))
            {
                throw new IdInvalidException("Bạn đã đạt giới hạn nộp CV trong tháng này. Nâng cấp VIP để nộp thêm.");
            }

            // Check if already applied - delete old and re-apply (matching Spring Boot logic)
            var existing = await _context.Resumes.FirstOrDefaultAsync(r => r.UserId == user.Id && r.JobId == job.Id);
            if (existing != null) 
            { 
                _context.Resumes.Remove(existing); 
                await _context.SaveChangesAsync(); 
            }

            resume.UserId = user.Id;
            resume.JobId = job.Id;
            resume.Email = email;
            resume.Status = ResumeStateEnum.REVIEWING;

            // AI SCORING LOGIC (Matching Java implementation)
            int score = 0;
            if (!string.IsNullOrEmpty(resume.Url))
            {
                try
                {
                    score = await _geminiService.ScoreCvAsync(job, resume.Url);
                    _logger.LogInformation(">>> AI Score for CV {FileName} on Job {JobId}: {Score}", resume.Url, job.Id, score);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to score CV with AI for Job {JobId}", job.Id);
                }
            }
            resume.Score = score;

            _context.Resumes.Add(resume);
            await _context.SaveChangesAsync();

            // Increment CV submission count after successful creation
            await _userService.IncrementCvSubmissionAsync(email);

            return _mapper.Map<ResCreateResumeDTO>(resume);
        }

        public async Task<ResUpdateResumeDTO?> UpdateAsync(long id, ResumeStateEnum? status, string? url = null, string? coverLetter = null)
        {
            var resume = await _context.Resumes.Include(r => r.Job).FirstOrDefaultAsync(r => r.Id == id);
            if (resume == null) return null;

            var email = _currentUserService.GetCurrentUserEmail();
            var currentUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (currentUser == null) throw new IdInvalidException("Bạn cần đăng nhập để thực hiện thao tác này");

            bool isEmployer = currentUser.CompanyId != null && resume.Job?.CompanyId == currentUser.CompanyId;
            bool isOwner = resume.UserId == currentUser.Id;

            // 1. Employer (HR) can update STATUS
            if (isEmployer && status.HasValue)
            {
                _logger.LogInformation(">>> [Update] HR {Email} updating status to {Status} for Resume {Id}", email, status, id);
                resume.Status = status.Value;

                // If APPROVED, decrease job quantity
                if (status == ResumeStateEnum.APPROVED && resume.Job != null)
                {
                    if (resume.Job.Quantity > 0)
                    {
                        resume.Job.Quantity--;
                        if (resume.Job.Quantity == 0) resume.Job.Active = false;
                    }
                }
            }

            // 2. User (Owner) can update URL and COVER LETTER
            if (isOwner)
            {
                if (!string.IsNullOrEmpty(coverLetter))
                {
                    resume.CoverLetter = coverLetter;
                }

                if (!string.IsNullOrEmpty(url) && url != resume.Url)
                {
                    _logger.LogInformation(">>> [Update] Owner {Email} updating CV URL to {New}. Re-scoring...", email, url);
                    resume.Url = url;
                    
                    if (resume.Job != null)
                    {
                        try
                        {
                            resume.Score = await _geminiService.ScoreCvAsync(resume.Job, resume.Url);
                            _logger.LogInformation(">>> AI Score re-calculated: {Score}", resume.Score);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to re-score CV during update");
                        }
                    }
                }
            }

            // Fallback for missing score (only if score is 0 and we are updating something)
            if (resume.Score <= 0 && !string.IsNullOrEmpty(resume.Url) && resume.Job != null && (isOwner || isEmployer))
            {
                try
                {
                    resume.Score = await _geminiService.ScoreCvAsync(resume.Job, resume.Url);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to score CV during update fallback");
                }
            }

            if (!isEmployer && !isOwner)
            {
                throw new IdInvalidException("Bạn không có quyền cập nhật hồ sơ này");
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
            if (resume.User != null && !resume.User.IsPublic) dto.Email = null;
            return dto;
        }

        public async Task<PaginatedResponse<ResFetchResumeDTO>> GetAllAsync(SieveModel sieveModel)
        {
            var page = sieveModel.Page ?? 1;
            var pageSize = sieveModel.PageSize ?? 10;

            var email = _currentUserService.GetCurrentUserEmail();
            if (string.IsNullOrEmpty(email))
                return new PaginatedResponse<ResFetchResumeDTO> { Meta = new PaginationMeta { Page = page, PageSize = pageSize }, Result = new List<ResFetchResumeDTO>() };

            var user = await _context.Users.Include(u => u.Company).FirstOrDefaultAsync(u => u.Email == email);
            if (user?.CompanyId == null)
                return new PaginatedResponse<ResFetchResumeDTO> { Meta = new PaginationMeta { Page = page, PageSize = pageSize }, Result = new List<ResFetchResumeDTO>() };

            var query = _context.Resumes.Include(r => r.User).Include(r => r.Job).ThenInclude(j => j!.Company)
                .Where(r => r.Job != null && r.Job.CompanyId == user.CompanyId).AsQueryable();

            query = _sieveProcessor.Apply(sieveModel, query, applyPagination: false);
            var total = await query.CountAsync();
            var paginatedQuery = _sieveProcessor.Apply(sieveModel, query, applyFiltering: false, applySorting: false, applyPagination: true);
            var items = await paginatedQuery.ToListAsync();
            var dtos = _mapper.Map<List<ResFetchResumeDTO>>(items);

            return new PaginatedResponse<ResFetchResumeDTO> { Meta = new PaginationMeta { Page = page, PageSize = pageSize, Pages = (int)Math.Ceiling((double)total / pageSize), Total = total }, Result = dtos };
        }

        public async Task<PaginatedResponse<ResFetchResumeDTO>> GetByUserAsync(SieveModel sieveModel)
        {
            var email = _currentUserService.GetCurrentUserEmail() ?? "";
            var query = _context.Resumes.Include(r => r.User).Include(r => r.Job).ThenInclude(j => j!.Company).Where(r => r.Email == email).AsQueryable();
            
            query = _sieveProcessor.Apply(sieveModel, query, applyPagination: false);
            var total = await query.CountAsync();
            var paginatedQuery = _sieveProcessor.Apply(sieveModel, query, applyFiltering: false, applySorting: false, applyPagination: true);
            var items = await paginatedQuery.ToListAsync();
            var dtos = _mapper.Map<List<ResFetchResumeDTO>>(items);

            var page = sieveModel.Page ?? 1;
            var pageSize = sieveModel.PageSize ?? 10;
            return new PaginatedResponse<ResFetchResumeDTO> { Meta = new PaginationMeta { Page = page, PageSize = pageSize, Pages = (int)Math.Ceiling((double)total / pageSize), Total = total }, Result = dtos };
        }

        public async Task NotifyUserAfterApprovedAsync(long id)
        {
            var resume = await _context.Resumes
                .Include(r => r.User)
                .Include(r => r.Job)
                .ThenInclude(j => j!.Company)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (resume == null || resume.User == null || resume.Job == null)
                throw new IdInvalidException($"Không tìm thấy resume với id={id} hoặc dữ liệu liên quan bị thiếu");

            if (resume.Status != ResumeStateEnum.APPROVED)
                throw new IdInvalidException("Resume phải ở trạng thái APPROVED mới có thể gửi thông báo");

            await _emailService.SendApprovalEmailAsync(
                resume.User.Email,
                resume.User.Name,
                resume.Job.Name,
                resume.Job.Company?.Name ?? "Công ty"
            );

            var hrEmail = _currentUserService.GetCurrentUserEmail() ?? "";
            var hr = await _context.Users.FirstOrDefaultAsync(u => u.Email == hrEmail);
            
            if (hr != null)
            {
                var messageContent = $"Chúc mừng {resume.User.Name}! Hồ sơ ứng tuyển của bạn cho vị trí {resume.Job.Name} đã được chấp thuận. Chúng tôi sẽ sớm liên hệ với bạn.";
                
                var chatMessage = new ChatMessage
                {
                    Content = messageContent,
                    SenderId = hr.Id,
                    ReceiverId = resume.UserId!.Value,
                    TimeStamp = DateTime.UtcNow
                };

                var savedMsg = await _chatService.SaveMessageAsync(chatMessage);

                await _hubContext.Clients.User(resume.User.Email).SendAsync("ReceiveMessage", new JobZone.ASP.NET.DTOs.Request.ChatNotificationDTO
                {
                    Id = savedMsg.Id,
                    Content = savedMsg.Content,
                    ReceiverId = savedMsg.ReceiverId,
                    SenderId = savedMsg.SenderId,
                    TimeStamp = savedMsg.TimeStamp ?? DateTime.UtcNow
                });
            }
        }
    }
}
