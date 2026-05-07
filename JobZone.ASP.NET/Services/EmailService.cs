using System.Net;
using System.Net.Mail;
using System.Text;

namespace JobZone.ASP.NET.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string content, bool isHtml = true);
        Task SendEmailFromTemplateAsync(string to, string subject, string username, object jobsData);
        Task SendApprovalEmailAsync(string to, string username, string jobName, string companyName);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendEmailAsync(string to, string subject, string content, bool isHtml = true)
        {
            try
            {
                var host = _configuration["Email:Host"];
                var portStr = _configuration["Email:Port"];
                var username = _configuration["Email:Username"];
                var password = _configuration["Email:Password"];
                var fromAddress = _configuration["Email:From"] ?? "noreply@hoidanit.vn";

                if (string.IsNullOrEmpty(host) || string.IsNullOrEmpty(username))
                {
                    _logger.LogWarning("Email settings are not configured properly. Skipping email send.");
                    return;
                }

                int.TryParse(portStr, out int port);
                
                using var client = new SmtpClient(host, port > 0 ? port : 587)
                {
                    Credentials = new NetworkCredential(username, password),
                    EnableSsl = true
                };

                using var mailMessage = new MailMessage
                {
                    From = new MailAddress(fromAddress),
                    Subject = subject,
                    Body = content,
                    IsBodyHtml = isHtml,
                };
                mailMessage.To.Add(to);

                await client.SendMailAsync(mailMessage);
                _logger.LogInformation("Email sent successfully to {To}", to);
            }
            catch (Exception ex)
            {
                _logger.LogError("ERROR SEND EMAIL: {Message}", ex.Message);
            }
        }

        public async Task SendEmailFromTemplateAsync(string to, string subject, string username, object jobsData)
        {
            var clientUrl = _configuration["Cors:AllowedOrigins:0"] ?? "http://localhost:3000";
            
            var sb = new StringBuilder();
            sb.AppendLine("<!DOCTYPE html><html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'>");
            sb.AppendLine("<style>");
            sb.AppendLine("body { margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }");
            sb.AppendLine(".container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }");
            sb.AppendLine(".header { padding: 30px 40px; background: linear-gradient(to right, #ec4899, #8b5cf6); color: #ffffff; text-align: center; }");
            sb.AppendLine(".content { padding: 30px 40px; }");
            sb.AppendLine(".job-card { border-bottom: 1px solid #f1f5f9; padding: 20px 0; }");
            sb.AppendLine(".job-title { color: #1e293b; font-size: 18px; font-weight: 700; text-decoration: none; margin-bottom: 4px; display: block; }");
            sb.AppendLine(".company-name { color: #64748b; font-size: 14px; margin-bottom: 8px; }");
            sb.AppendLine(".salary { color: #ec4899; font-weight: 600; font-size: 15px; margin-bottom: 12px; }");
            sb.AppendLine(".skill-badge { display: inline-block; background-color: #f1f5f9; color: #475569; font-size: 12px; padding: 4px 10px; border-radius: 20px; margin-right: 5px; margin-bottom: 5px; }");
            sb.AppendLine(".btn-cta { display: block; text-align: center; background: linear-gradient(to right, #ec4899, #8b5cf6); color: #ffffff !important; text-decoration: none; padding: 15px 25px; border-radius: 30px; font-weight: 700; margin-top: 30px; text-transform: uppercase; letter-spacing: 0.5px; }");
            sb.AppendLine(".footer { padding: 20px 40px; text-align: center; color: #94a3b8; font-size: 13px; background-color: #f8fafc; }");
            sb.AppendLine("</style></head><body>");
            
            sb.AppendLine("<table width='100%' cellspacing='0' cellpadding='0' border='0'><tr><td align='center' style='padding: 20px 0;'>");
            sb.AppendLine("<div class='container'>");
            sb.AppendLine("<div class='header'><h1 style='margin: 0; font-size: 24px;'> <span style='font-weight: normal;'>JobZone</span></h1>");
            sb.AppendLine("<p style='margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;'>Ít nhưng mà chất 👋🏻</p></div>");
            
            sb.AppendLine("<div class='content'>");
            sb.AppendLine($"<div style='font-size: 16px; color: #334155; margin-bottom: 20px;'>Xin chào <strong>{username}</strong>,<br />");
            sb.AppendLine("Dựa trên hồ sơ của bạn, chúng tôi đã tìm thấy một số cơ hội nghề nghiệp hấp dẫn dành riêng cho bạn:</div>");

            if (jobsData is IEnumerable<dynamic> jobs)
            {
                foreach (var job in jobs)
                {
                    string salaryStr = job.Salary != null ? string.Format("{0:N0}", job.Salary) : "Thỏa thuận";
                    string jobDetailUrl = $"{clientUrl}/job/detail/{job.Id}";

                    sb.AppendLine("<div class='job-card'>");
                    sb.AppendLine($"<a href='{jobDetailUrl}' class='job-title'>{job.Name}</a>");
                    sb.AppendLine($"<div class='company-name'>{job.Company?.Name}</div>");
                    sb.AppendLine($"<div class='salary'>{salaryStr} VNĐ</div>");
                    sb.AppendLine("<div>");
                    
                    if (job.Skills != null)
                    {
                        foreach (var skill in job.Skills)
                        {
                            sb.AppendLine($"<span class='skill-badge'>{skill.Name}</span>");
                        }
                    }
                    
                    sb.AppendLine("</div></div>");
                }
            }

            sb.AppendLine($"<a href='{clientUrl}' class='btn-cta'>Khám phá tất cả việc làm</a>");
            sb.AppendLine("<div style='margin-top: 30px; font-size: 14px; color: #64748b;'>Trân trọng,<br /><strong>JobZone Team</strong></div>");
            sb.AppendLine("</div>");
            
            sb.AppendLine("<div class='footer'>&copy; 2026 JobZone. All rights reserved.<br />Ho Chi Minh City, Vietnam.</div>");
            sb.AppendLine("</div></td></tr></table></body></html>");

            await SendEmailAsync(to, subject, sb.ToString(), true);
        }

        public async Task SendApprovalEmailAsync(string to, string username, string jobName, string companyName)
        {
            var sb = new StringBuilder();
            sb.AppendLine("<!DOCTYPE html><html><body style='font-family: Arial, sans-serif;'>");
            sb.AppendLine("<div style='max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;'>");
            sb.AppendLine("<h1 style='color: #2c3e50;'>Chúc mừng!</h1>");
            sb.AppendLine($"<p>Chào <strong>{username}</strong>,</p>");
            sb.AppendLine($"<p>Chúng tôi rất vui mừng thông báo rằng hồ sơ của bạn cho vị trí <strong>{jobName}</strong> tại <strong>{companyName}</strong> đã được chấp thuận.</p>");
            sb.AppendLine("<p>Đại diện công ty sẽ sớm liên hệ với bạn qua hệ thống Chat của JobZone để trao đổi về bước tiếp theo.</p>");
            sb.AppendLine("<p>Chúc bạn có một ngày làm việc hiệu quả!</p>");
            sb.AppendLine("<br/>");
            sb.AppendLine("<p>Trân trọng,</p>");
            sb.AppendLine("<p><strong>JobZone Team</strong></p>");
            sb.AppendLine("</div>");
            sb.AppendLine("</body></html>");

            await SendEmailAsync(to, "Chúc mừng! Hồ sơ ứng tuyển của bạn đã được chấp thuận", sb.ToString(), true);
        }
    }
}
