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
    public interface IUserService
    {
        Task<User?> GetUserByEmailAsync(string email);
        Task<User?> GetUserByIdAsync(long id);
        Task<bool> IsEmailExistAsync(string email);
        Task<User> CreateUserAsync(User user);
        Task<User?> UpdateUserAsync(User reqUser);
        Task<User?> UpdateOwnUserAsync(User reqUser);
        Task DeleteUserAsync(long id);
        Task<PaginatedResponse<ResUserDTO>> GetAllUsersAsync(SieveModel sieveModel);
        Task<UserSession> CreateSessionAsync(User user, string jti, DateTime expiresAt);
        Task<UserSession?> FindSessionByJtiAsync(string jti);
        Task DeleteSessionByJtiAsync(string jti);
        Task<List<UserSession>> GetSessionsForUserAsync(long userId);
        Task DeleteSessionByIdAsync(long sessionId, long userId);
        Task CheckAndEnforceSessionLimitAsync(User user);
        Task EnforceSessionLimitAndKickOldestAsync(User user);
        Task DeleteAllOtherSessionsAsync(long userId, string currentJti);
        Task DeleteSessionsByIdsAsync(List<long> sessionIds, long userId);
        Task<User> SaveUserWithNewPasswordAsync(User user, string newPassword);
        Task<User> SaveUserAsync(User user);
        Task UpdateUserIsPublicAsync(bool isPublic);
        Task<List<ResUserDTO>> FindConnectedUsersAsync(long userId);
        Task UpdateStatusAsync(User userPayload);
        Task DisconnectAsync(User userPayload);
        Task<ResUploadFileDTO> UploadMainResumeAsync(IFormFile file);
        Task<List<string>> GetPermissionKeysByEmailAsync(string email);
        Task<long?> GetLastSecurityUpdateAtAsync(string email);
        Task ChangePasswordAsync(string email, string newPassword);
        bool CanSubmitCv(string email);
        Task IncrementCvSubmissionAsync(string email);
    }

    public class UserService : IUserService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly ICurrentUserService _currentUserService;
        private readonly ILogger<UserService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IFileService _fileService;
        private readonly ISieveProcessor _sieveProcessor;
        private const int MaxSessionsPerUser = 50;

        public UserService(AppDbContext context, IMapper mapper,
            ICurrentUserService currentUserService, ILogger<UserService> logger,
            IHttpContextAccessor httpContextAccessor, IFileService fileService, ISieveProcessor sieveProcessor)
        {
            _context = context;
            _mapper = mapper;
            _currentUserService = currentUserService;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
            _fileService = fileService;
            _sieveProcessor = sieveProcessor;
        }

        public async Task<User?> GetUserByEmailAsync(string email)
        {
            return await _context.Users
                .Include(u => u.Company)
                .Include(u => u.Role)
                    .ThenInclude(r => r.Permissions)
                .FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<User?> GetUserByIdAsync(long id)
        {
            return await _context.Users
                .Include(u => u.Company)
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == id);
        }

        public async Task<bool> IsEmailExistAsync(string email)
        {
            return await _context.Users.AnyAsync(u => u.Email == email);
        }

        public async Task<User> CreateUserAsync(User user)
        {
            // Handle company
            if (user.CompanyId.HasValue && user.CompanyId > 0)
            {
                var company = await _context.Companies.FindAsync(user.CompanyId.Value);
                user.Company = company;
            }

            // Handle role
            if (user.RoleId.HasValue && user.RoleId > 0)
            {
                var role = await _context.Roles.FindAsync(user.RoleId.Value);
                user.Role = role;
            }
            else
            {
                // Default role = USER (matching Spring Boot logic)
                var defaultRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "USER");
                if (defaultRole == null)
                    throw new IdInvalidException("Không tìm thấy Role 'USER' trong hệ thống");
                user.Role = defaultRole;
                user.RoleId = defaultRole.Id;
            }

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<User?> UpdateUserAsync(User reqUser)
        {
            var currentUser = await GetUserByIdAsync(reqUser.Id);
            if (currentUser == null) return null;

            // Track role changes for security timestamp
            long? oldRoleId = currentUser.RoleId;
            long? newRoleId = reqUser.RoleId;
            bool roleChanged = oldRoleId != newRoleId;

            currentUser.Address = reqUser.Address;
            currentUser.Gender = reqUser.Gender;
            currentUser.Age = reqUser.Age;
            currentUser.Name = reqUser.Name;
            currentUser.IsVip = reqUser.IsVip;

            // Update company
            if (reqUser.CompanyId.HasValue && reqUser.CompanyId > 0)
            {
                currentUser.CompanyId = reqUser.CompanyId;
            }
            else
            {
                currentUser.CompanyId = null;
                currentUser.Company = null;
            }

            // Update role
            if (reqUser.RoleId.HasValue && reqUser.RoleId > 0)
            {
                currentUser.RoleId = reqUser.RoleId;
            }
            else
            {
                currentUser.RoleId = null;
                currentUser.Role = null;
            }

            if (roleChanged)
            {
                currentUser.LastSecurityUpdateAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return currentUser;
        }

        public async Task<User?> UpdateOwnUserAsync(User reqUser)
        {
            var currentEmail = _currentUserService.GetCurrentUserEmail();
            if (string.IsNullOrEmpty(currentEmail))
                throw new IdInvalidException("Không thể lấy thông tin người dùng đang đăng nhập.");

            var loggedInUser = await GetUserByEmailAsync(currentEmail);
            if (loggedInUser == null)
                throw new IdInvalidException($"Người dùng với email {currentEmail} không tồn tại.");

            if (loggedInUser.Id != reqUser.Id)
                throw new IdInvalidException("Bạn không có quyền cập nhật thông tin của người dùng khác.");

            loggedInUser.Name = reqUser.Name;
            loggedInUser.Age = reqUser.Age;
            loggedInUser.Gender = reqUser.Gender;
            loggedInUser.Address = reqUser.Address;
            loggedInUser.Avatar = reqUser.Avatar;

            await _context.SaveChangesAsync();
            return loggedInUser;
        }

        public async Task DeleteUserAsync(long id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user != null)
            {
                var chatMessages = await _context.ChatMessages
                    .Where(m => m.SenderId == id || m.ReceiverId == id)
                    .ToListAsync();
                _context.ChatMessages.RemoveRange(chatMessages);

                var chatRooms = await _context.ChatRooms
                    .Where(r => r.SenderId == id || r.ReceiverId == id)
                    .ToListAsync();
                _context.ChatRooms.RemoveRange(chatRooms);

                var comments = await _context.Comments
                    .Where(c => c.UserId == id)
                    .ToListAsync();
                _context.Comments.RemoveRange(comments);

                _context.Users.Remove(user);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<PaginatedResponse<ResUserDTO>> GetAllUsersAsync(SieveModel sieveModel)
        {
            var query = _context.Users
                .Include(u => u.Company)
                .Include(u => u.Role)
                .AsQueryable();

            query = _sieveProcessor.Apply(sieveModel, query, applyPagination: false);
            var total = await query.CountAsync();
            var paginatedQuery = _sieveProcessor.Apply(sieveModel, query, applyFiltering: false, applySorting: false, applyPagination: true);
            var items = await paginatedQuery.ToListAsync();
            var dtos = _mapper.Map<List<ResUserDTO>>(items);
            var page = sieveModel.Page ?? 1;
            var pageSize = sieveModel.PageSize ?? 10;

            return new PaginatedResponse<ResUserDTO>
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

        public async Task<UserSession> CreateSessionAsync(User user, string jti, DateTime expiresAt)
        {
            // Capture IP and User-Agent from HttpContext (matching Java: request.getRemoteAddr(), request.getHeader("User-Agent"))
            string ipAddress = "unknown";
            string userAgent = "unknown";

            try
            {
                var httpContext = _httpContextAccessor.HttpContext;
                if (httpContext != null)
                {
                    ipAddress = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                    userAgent = httpContext.Request.Headers["User-Agent"].ToString();
                    if (string.IsNullOrEmpty(userAgent)) userAgent = "unknown";
                }
            }
            catch
            {
                _logger.LogWarning("Không thể lấy thông tin request (IP/User-Agent) cho session.");
            }

            var session = new UserSession
            {
                UserId = user.Id,
                RefreshTokenJti = jti,
                ExpiresAt = expiresAt,
                IpAddress = ipAddress,
                UserAgent = userAgent
            };

            _context.UserSessions.Add(session);
            await _context.SaveChangesAsync();
            return session;
        }

        public async Task<UserSession?> FindSessionByJtiAsync(string jti)
        {
            return await _context.UserSessions
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.RefreshTokenJti == jti);
        }

        public async Task DeleteSessionByJtiAsync(string jti)
        {
            var session = await _context.UserSessions.FirstOrDefaultAsync(s => s.RefreshTokenJti == jti);
            if (session != null)
            {
                _context.UserSessions.Remove(session);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<List<UserSession>> GetSessionsForUserAsync(long userId)
        {
            return await _context.UserSessions
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();
        }

        public async Task DeleteSessionByIdAsync(long sessionId, long userId)
        {
            var session = await _context.UserSessions.FindAsync(sessionId);
            if (session == null) throw new IdInvalidException("Session không tồn tại");
            if (session.UserId != userId) throw new IdInvalidException("Bạn không có quyền xóa session này");

            _context.UserSessions.Remove(session);
            await _context.SaveChangesAsync();
        }

        public async Task CheckAndEnforceSessionLimitAsync(User user)
        {
            await PurgeExpiredSessionsAsync(user.Id);

            var activeCount = await _context.UserSessions
                .CountAsync(s => s.UserId == user.Id && s.ExpiresAt > DateTime.UtcNow);

            if (activeCount >= MaxSessionsPerUser)
            {
                _logger.LogWarning("User {Email} đã đạt giới hạn {Max} session hoạt động.", user.Email, MaxSessionsPerUser);
                throw new SessionLimitExceededException(
                    $"Bạn đã đạt giới hạn tối đa {MaxSessionsPerUser} thiết bị đăng nhập. Vui lòng đăng xuất ở một thiết bị khác.");
            }

            await _context.SaveChangesAsync();
        }

        public async Task<User> SaveUserWithNewPasswordAsync(User user, string newPassword)
        {
            user.Password = BCrypt.Net.BCrypt.HashPassword(newPassword);
            user.LastSecurityUpdateAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<User> SaveUserAsync(User user)
        {
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task UpdateUserIsPublicAsync(bool isPublic)
        {
            var email = _currentUserService.GetCurrentUserEmail();
            if (string.IsNullOrEmpty(email))
                throw new IdInvalidException("Không tìm thấy user");

            var user = await GetUserByEmailAsync(email);
            if (user == null) throw new IdInvalidException("User không tồn tại");

            user.IsPublic = isPublic;
            await _context.SaveChangesAsync();
        }

        public async Task<List<ResUserDTO>> FindConnectedUsersAsync(long userId)
        {
            // Find chat rooms where user is sender or receiver
            var chatRooms = await _context.ChatRooms
                .Include(cr => cr.Sender)
                .Include(cr => cr.Receiver)
                .Where(cr => cr.SenderId == userId || cr.ReceiverId == userId)
                .ToListAsync();

            var partnerIds = chatRooms.Select(cr => cr.SenderId == userId ? cr.ReceiverId : cr.SenderId).Distinct().ToList();

            if (!partnerIds.Any()) return new List<ResUserDTO>();

            // Find last messages for these partners
            var lastMessages = await _context.ChatMessages
                .Include(cm => cm.Sender)
                .Include(cm => cm.Receiver)
                .Where(cm => (cm.SenderId == userId && partnerIds.Contains(cm.ReceiverId)) || 
                             (cm.ReceiverId == userId && partnerIds.Contains(cm.SenderId)))
                .GroupBy(cm => cm.SenderId == userId ? cm.ReceiverId : cm.SenderId)
                .Select(g => g.OrderByDescending(cm => cm.TimeStamp ?? cm.CreatedAt).FirstOrDefault())
                .ToListAsync();

            var lastMessageMap = lastMessages
                .Where(m => m != null)
                .ToDictionary(m => m!.SenderId == userId ? m.ReceiverId : m.SenderId, m => m);

            var partners = await _context.Users
                .Include(u => u.Company)
                .Include(u => u.Role)
                .Where(u => partnerIds.Contains(u.Id))
                .ToListAsync();

            return partners.Select(user => {
                var dto = _mapper.Map<ResUserDTO>(user);
                if (lastMessageMap.TryGetValue(user.Id, out var lastMsgEntity) && lastMsgEntity != null)
                {
                    dto.LastMessage = new ResLastMessageDTO
                    {
                        Content = lastMsgEntity.Content,
                        SenderId = lastMsgEntity.SenderId,
                        Timestamp = lastMsgEntity.TimeStamp ?? lastMsgEntity.CreatedAt
                    };
                }
                return dto;
            }).ToList();
        }

        public async Task UpdateStatusAsync(User userPayload)
        {
            await SetUserStatusAsync(userPayload.Id, Enums.UserStatusEnum.ONLINE);
        }

        public async Task DisconnectAsync(User userPayload)
        {
            await SetUserStatusAsync(userPayload.Id, Enums.UserStatusEnum.OFFLINE);
        }

        public async Task EnforceSessionLimitAndKickOldestAsync(User user)
        {
            await PurgeExpiredSessionsAsync(user.Id);

            var now = DateTime.UtcNow;
            var activeCount = await _context.UserSessions
                .CountAsync(s => s.UserId == user.Id && s.ExpiresAt > now);

            if (activeCount >= MaxSessionsPerUser)
            {
                _logger.LogWarning("User {Email} đạt giới hạn session. Đang xóa session cũ nhất...", user.Email);

                var oldest = await _context.UserSessions
                    .Where(s => s.UserId == user.Id && s.ExpiresAt > now)
                    .OrderBy(s => s.CreatedAt)
                    .FirstOrDefaultAsync();

                if (oldest != null)
                {
                    _context.UserSessions.Remove(oldest);
                    _logger.LogInformation("Đã xóa session cũ nhất (ID: {SessionId}) của user {Email}", oldest.Id, user.Email);
                }
            }

            await _context.SaveChangesAsync();
        }

        public async Task DeleteAllOtherSessionsAsync(long userId, string currentJti)
        {
            var otherSessions = await _context.UserSessions
                .Where(s => s.UserId == userId && s.RefreshTokenJti != currentJti)
                .ToListAsync();

            if (otherSessions.Any())
            {
                _context.UserSessions.RemoveRange(otherSessions);
                await _context.SaveChangesAsync();
            }
        }

        public async Task DeleteSessionsByIdsAsync(List<long> sessionIds, long userId)
        {
            if (sessionIds == null || !sessionIds.Any()) return;

            var sessions = await _context.UserSessions
                .Where(s => sessionIds.Contains(s.Id) && s.UserId == userId)
                .ToListAsync();

            _context.UserSessions.RemoveRange(sessions);
            await _context.SaveChangesAsync();
        }

        public async Task<ResUploadFileDTO> UploadMainResumeAsync(IFormFile file)
        {
            var user = await GetCurrentUserAsync();

            if (file == null || file.Length == 0)
                throw new StorageException("File CV trống. Vui lòng chọn một file.");

            var allowedExtensions = new[] { ".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png" };
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(ext))
                throw new StorageException($"Định dạng file không hợp lệ. Chỉ hỗ trợ: {string.Join(", ", allowedExtensions)}");

            _fileService.CreateDirectory("resumes");
            var uploadedFileName = await _fileService.StoreAsync(file, "resumes");

            user.MainResume = uploadedFileName;
            await _context.SaveChangesAsync();

            return new ResUploadFileDTO
            {
                FileName = uploadedFileName,
                UploadedAt = DateTime.UtcNow
            };
        }

        public async Task<List<string>> GetPermissionKeysByEmailAsync(string email)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                    .ThenInclude(r => r!.Permissions)
                .FirstOrDefaultAsync(u => u.Email == email);

            if (user?.Role?.Permissions == null)
                return new List<string>();

            return user.Role.Permissions
                .Select(p => $"{p.Method}:{p.ApiPath}".ToUpperInvariant())
                .Distinct()
                .ToList();
        }

        public async Task<long?> GetLastSecurityUpdateAtAsync(string email)
        {
            if (string.IsNullOrEmpty(email)) return null;

            var timestamp = await _context.Users
                .Where(u => u.Email == email)
                .Select(u => u.LastSecurityUpdateAt)
                .FirstOrDefaultAsync();

            return timestamp.HasValue
                ? new DateTimeOffset(timestamp.Value, TimeSpan.Zero).ToUnixTimeMilliseconds()
                : null;
        }

        public async Task ChangePasswordAsync(string email, string newPassword)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email)
                ?? throw new IdInvalidException("User không tồn tại");

            user.Password = BCrypt.Net.BCrypt.HashPassword(newPassword);
            user.LastSecurityUpdateAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public bool CanSubmitCv(string email)
        {
            var user = _context.Users.FirstOrDefault(u => u.Email == email);
            if (user == null) return false;

            if (user.IsVip && user.VipExpiryDate.HasValue && user.VipExpiryDate.Value < DateTime.UtcNow)
            {
                user.IsVip = false;
                user.CvSubmissionCount = 0;
                _context.SaveChanges();
            }

            var maxSubmissions = user.IsVip ? 20 : 10;
            return user.CvSubmissionCount < maxSubmissions;
        }

        public async Task IncrementCvSubmissionAsync(string email)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user != null)
            {
                user.CvSubmissionCount++;
                await _context.SaveChangesAsync();
            }
        }

        // ========================
        // PRIVATE HELPERS
        // ========================

        private async Task<User> GetCurrentUserAsync()
        {
            var email = _currentUserService.GetCurrentUserEmail()
                ?? throw new IdInvalidException("Không tìm thấy người dùng");

            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email)
                ?? throw new IdInvalidException("Người dùng không tồn tại");
        }

        private async Task PurgeExpiredSessionsAsync(long userId)
        {
            var expired = await _context.UserSessions
                .Where(s => s.UserId == userId && s.ExpiresAt < DateTime.UtcNow)
                .ToListAsync();
            _context.UserSessions.RemoveRange(expired);
        }

        private async Task SetUserStatusAsync(long userId, Enums.UserStatusEnum status)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                user.Status = status;
                await _context.SaveChangesAsync();
            }
        }
    }
}
