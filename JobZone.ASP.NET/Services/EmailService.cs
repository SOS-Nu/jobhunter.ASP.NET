using System.Net;
using System.Net.Mail;
using System.Text;

namespace JobZone.ASP.NET.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string content, bool isHtml = true);
        Task SendEmailFromTemplateAsync(string to, string subject, string username, object jobsData);
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
            // Create a simple HTML template programmatically since we don't have Thymeleaf
            var sb = new StringBuilder();
            sb.AppendLine("<!DOCTYPE html><html><body>");
            sb.AppendLine($"<h2>Xin chào {username},</h2>");
            sb.AppendLine("<p>Đây là danh sách công việc phù hợp với kỹ năng của bạn:</p>");
            sb.AppendLine("<ul>");
            
            // Format jobsData (assuming it's a list of ResEmailJob)
            if (jobsData is IEnumerable<dynamic> jobs)
            {
                foreach (var job in jobs)
                {
                    sb.AppendLine($"<li><b>{job.Name}</b> tại {job.Company?.Name} - Lương: {job.Salary}</li>");
                }
            }
            
            sb.AppendLine("</ul>");
            sb.AppendLine("<p>Trân trọng,</p>");
            sb.AppendLine("<p>JobZone Team</p>");
            sb.AppendLine("</body></html>");

            await SendEmailAsync(to, subject, sb.ToString(), true);
        }
    }
}
