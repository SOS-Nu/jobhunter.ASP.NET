using System.Security.Cryptography;
using System.Text;
using System.Web;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using jobhunter.ASP.NET.Data;
using jobhunter.ASP.NET.DTOs.Request;
using jobhunter.ASP.NET.DTOs.Response;
using jobhunter.ASP.NET.Entities;
using jobhunter.ASP.NET.Enums;
using jobhunter.ASP.NET.Middleware;
using jobhunter.ASP.NET.Models;

namespace jobhunter.ASP.NET.Services
{
    public interface IPaymentService
    {
        Task<ResPaymentUrlDTO> CreatePaymentUrlAsync(string ipAddress);
        Task<ResPaymentCallbackDTO> HandleCallbackAsync(Dictionary<string, string> queryParams);
        Task<List<ResPaymentHistoryDTO>> GetPaymentHistoryAsync();
        Task<PaginatedResponse<ResPaymentHistoryDTO>> GetAllPaymentHistoryAsync(int page, int pageSize);
        Task<ResPaymentHistoryDTO> GetPaymentHistoryByIdAsync(long id);
        Task<ResPaymentHistoryDTO> UpdatePaymentHistoryStatusAsync(ReqUpdatePaymentStatusDTO dto);
        Task<byte[]> ExportPaymentExcelAsync();
    }

    public class PaymentService : IPaymentService
    {
        private readonly AppDbContext _context;
        private readonly ICurrentUserService _currentUserService;
        private readonly IMapper _mapper;
        private readonly IConfiguration _configuration;
        private readonly ILogger<PaymentService> _logger;

        public PaymentService(
            AppDbContext context,
            ICurrentUserService currentUserService,
            IMapper mapper,
            IConfiguration configuration,
            ILogger<PaymentService> logger)
        {
            _context = context;
            _currentUserService = currentUserService;
            _mapper = mapper;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<ResPaymentUrlDTO> CreatePaymentUrlAsync(string ipAddress)
        {
            var user = await GetCurrentUserAsync();

            var vnpTmnCode = _configuration["VNPay:TmnCode"]!;
            var vnpHashSecret = _configuration["VNPay:HashSecret"]!;
            var vnpPaymentUrl = _configuration["VNPay:Url"]!;
            var vnpReturnUrl = _configuration["VNPay:ReturnUrl"]!;
            var vnpVersion = _configuration["VNPay:Version"] ?? "2.1.0";
            var vnpCommand = _configuration["VNPay:Command"] ?? "pay";

            var orderId = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();
            long amount = 50000 * 100; // 50,000 VND * 100 (VNPay requires amount * 100)
            var orderInfo = $"Thanh toan goi VIP cho {user.Email}";
            var now = DateTime.Now;

            var vnpParams = new SortedDictionary<string, string>
            {
                { "vnp_Version", vnpVersion },
                { "vnp_Command", vnpCommand },
                { "vnp_TmnCode", vnpTmnCode },
                { "vnp_Amount", amount.ToString() },
                { "vnp_CurrCode", "VND" },
                { "vnp_TxnRef", orderId },
                { "vnp_OrderInfo", orderInfo },
                { "vnp_OrderType", "250000" },
                { "vnp_Locale", "vn" },
                { "vnp_ReturnUrl", vnpReturnUrl },
                { "vnp_IpAddr", ipAddress },
                { "vnp_CreateDate", now.ToString("yyyyMMddHHmmss") },
                { "vnp_ExpireDate", now.AddMinutes(15).ToString("yyyyMMddHHmmss") }
            };

            var hashData = BuildQueryString(vnpParams);
            var secureHash = HmacSHA512(vnpHashSecret, hashData);
            vnpParams["vnp_SecureHash"] = secureHash;

            var paymentUrl = vnpPaymentUrl + "?" + BuildQueryString(vnpParams);
            return new ResPaymentUrlDTO { Url = paymentUrl };
        }

        public async Task<ResPaymentCallbackDTO> HandleCallbackAsync(Dictionary<string, string> queryParams)
        {
            var vnpHashSecret = _configuration["VNPay:HashSecret"]!;

            var secureHash = queryParams.GetValueOrDefault("vnp_SecureHash") ?? "";
            queryParams.Remove("vnp_SecureHash");

            var sorted = new SortedDictionary<string, string>(queryParams);
            var calculatedHash = HmacSHA512(vnpHashSecret, BuildQueryString(sorted));

            if (!calculatedHash.Equals(secureHash, StringComparison.OrdinalIgnoreCase))
                return new ResPaymentCallbackDTO { Status = "error", Message = "Chữ ký không hợp lệ" };

            var responseCode = queryParams.GetValueOrDefault("vnp_ResponseCode") ?? "";
            var orderInfo = queryParams.GetValueOrDefault("vnp_OrderInfo") ?? "";
            var email = orderInfo.Replace("Thanh toan goi VIP cho ", "");
            var orderId = queryParams.GetValueOrDefault("vnp_TxnRef") ?? "";
            long.TryParse(queryParams.GetValueOrDefault("vnp_Amount") ?? "0", out long amount);

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
                return new ResPaymentCallbackDTO { Status = "error", Message = "Người dùng không tồn tại" };

            var isSuccess = responseCode == "00";

            _context.PaymentHistories.Add(new PaymentHistory
            {
                UserId = user.Id,
                Amount = amount,
                OrderId = orderId,
                ResponseCode = responseCode,
                Status = isSuccess ? PaymentStatusEnum.SUCCESS : PaymentStatusEnum.FAILED
            });
            await _context.SaveChangesAsync();

            if (isSuccess)
            {
                user.IsVip = true;
                user.VipExpiryDate = DateTime.UtcNow.AddMinutes(
                    double.TryParse(_configuration["VipDurationMinutes"], out var mins) ? mins : 43200);
                user.CvSubmissionCount = 0;
                await _context.SaveChangesAsync();

                return new ResPaymentCallbackDTO
                {
                    Status = "success",
                    Message = "Thanh toán thành công, tài khoản VIP đã được kích hoạt"
                };
            }

            return new ResPaymentCallbackDTO { Status = "error", Message = $"Thanh toán thất bại: {responseCode}" };
        }

        public async Task<List<ResPaymentHistoryDTO>> GetPaymentHistoryAsync()
        {
            var user = await GetCurrentUserAsync();

            return await _context.PaymentHistories
                .Include(ph => ph.User)
                .Where(ph => ph.UserId == user.Id)
                .OrderByDescending(ph => ph.CreatedAt)
                .Select(PaymentHistoryProjection)
                .ToListAsync();
        }

        public async Task<PaginatedResponse<ResPaymentHistoryDTO>> GetAllPaymentHistoryAsync(int page, int pageSize)
        {
            await GetCurrentUserAsync(); // auth gate

            var query = _context.PaymentHistories.Include(ph => ph.User).AsQueryable();
            var total = await query.CountAsync();

            var items = await query
                .OrderByDescending(ph => ph.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(PaymentHistoryProjection)
                .ToListAsync();

            return new PaginatedResponse<ResPaymentHistoryDTO>
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

        public async Task<ResPaymentHistoryDTO> GetPaymentHistoryByIdAsync(long id)
        {
            await GetCurrentUserAsync(); // auth gate

            var ph = await _context.PaymentHistories
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.Id == id)
                ?? throw new IdInvalidException($"Payment history với ID {id} không tồn tại");

            return _mapper.Map<ResPaymentHistoryDTO>(ph);
        }

        public async Task<ResPaymentHistoryDTO> UpdatePaymentHistoryStatusAsync(ReqUpdatePaymentStatusDTO dto)
        {
            await GetCurrentUserAsync(); // auth gate

            var ph = await _context.PaymentHistories
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.Id == dto.Id)
                ?? throw new IdInvalidException($"Payment history với ID {dto.Id} không tồn tại");

            if (!Enum.TryParse<PaymentStatusEnum>(dto.Status, out var parsedStatus))
                throw new IdInvalidException("Trạng thái chỉ được là SUCCESS hoặc FAILED");

            ph.Status = parsedStatus;
            await _context.SaveChangesAsync();

            return _mapper.Map<ResPaymentHistoryDTO>(ph);
        }

        public async Task<byte[]> ExportPaymentExcelAsync()
        {
            await GetCurrentUserAsync(); // auth gate

            var histories = await _context.PaymentHistories
                .Include(ph => ph.User)
                .OrderByDescending(ph => ph.CreatedAt)
                .ToListAsync();

            var sb = new StringBuilder();
            sb.AppendLine("ID,User Email,Số Tiền (VND),Mã Đơn Hàng,Trạng Thái,Ngày Tạo");

            foreach (var h in histories)
            {
                sb.AppendLine($"{h.Id},{h.User?.Email},{h.Amount},{h.OrderId},{h.Status},{h.CreatedAt:dd/MM/yyyy HH:mm:ss}");
            }

            return Encoding.UTF8.GetBytes(sb.ToString());
        }

        // ========================
        // PRIVATE HELPERS
        // ========================

        /// <summary>
        /// Single auth + user lookup used by all authenticated endpoints.
        /// Replaces the 6x duplicated email-check + user-fetch pattern.
        /// </summary>
        private async Task<User> GetCurrentUserAsync()
        {
            var email = _currentUserService.GetCurrentUserEmail()
                ?? throw new IdInvalidException("Bạn cần đăng nhập");

            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email)
                ?? throw new IdInvalidException("Người dùng không tồn tại");
        }

        /// <summary>
        /// Single projection expression reused by GetPaymentHistory and GetAllPaymentHistory.
        /// Replaces 3x copy-pasted Select blocks.
        /// </summary>
        private static readonly System.Linq.Expressions.Expression<Func<PaymentHistory, ResPaymentHistoryDTO>> PaymentHistoryProjection =
            ph => new ResPaymentHistoryDTO
            {
                Id = ph.Id,
                UserEmail = ph.User.Email,
                UserId = ph.User.Id,
                Amount = ph.Amount,
                OrderId = ph.OrderId,
                ResponseCode = ph.ResponseCode,
                Status = ph.Status.ToString(),
                CreatedAt = ph.CreatedAt,
                UpdatedAt = ph.UpdatedAt,
                UpdatedBy = ph.UpdatedBy
            };

        /// <summary>
        /// Builds a URL-encoded query string from sorted params.
        /// Replaces 2x duplicated StringBuilder loops (one for hash, one for URL).
        /// </summary>
        private static string BuildQueryString(SortedDictionary<string, string> parameters)
        {
            var sb = new StringBuilder();
            foreach (var entry in parameters)
            {
                if (sb.Length > 0) sb.Append('&');
                sb.Append(entry.Key).Append('=').Append(HttpUtility.UrlEncode(entry.Value, Encoding.UTF8));
            }
            return sb.ToString();
        }

        private static string HmacSHA512(string key, string data)
        {
            using var hmac = new HMACSHA512(Encoding.UTF8.GetBytes(key));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
            return Convert.ToHexString(hash).ToLowerInvariant();
        }
    }
}
