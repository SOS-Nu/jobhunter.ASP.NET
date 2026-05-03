using Microsoft.EntityFrameworkCore;
using jobhunter.ASP.NET.Data;
using jobhunter.ASP.NET.Entities;

namespace jobhunter.ASP.NET.Services
{
    public interface IOtpService
    {
        string GenerateOtp();
        Task SaveOtpAsync(string email, string otpCode);
        Task<Otp> ValidateOtpAsync(string email, string otpCode);
    }

    public class OtpService : IOtpService
    {
        private readonly AppDbContext _context;

        public OtpService(AppDbContext context)
        {
            _context = context;
        }

        public string GenerateOtp()
        {
            var random = new Random();
            return random.Next(0, 1000000).ToString("D6");
        }

        public async Task SaveOtpAsync(string email, string otpCode)
        {
            var otp = new Otp
            {
                Email = email,
                OtpCode = otpCode,
                ExpiresAt = DateTime.UtcNow.AddMinutes(5), // OTP hết hạn sau 5 phút
                Used = false
            };

            _context.Otps.Add(otp);
            await _context.SaveChangesAsync();
        }

        public async Task<Otp> ValidateOtpAsync(string email, string otpCode)
        {
            var otp = await _context.Otps
                .FirstOrDefaultAsync(o => o.Email == email && o.OtpCode == otpCode && !o.Used && o.ExpiresAt > DateTime.UtcNow);

            if (otp == null)
            {
                throw new Middleware.IdInvalidException("Mã OTP không hợp lệ hoặc đã hết hạn");
            }

            otp.Used = true;
            await _context.SaveChangesAsync();
            
            return otp;
        }
    }
}
