using Microsoft.EntityFrameworkCore;
using JobZone.ASP.NET.Data;

namespace JobZone.ASP.NET.Services
{
    public class BackgroundWorkerService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<BackgroundWorkerService> _logger;

        public BackgroundWorkerService(IServiceProvider serviceProvider, ILogger<BackgroundWorkerService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("BackgroundWorkerService is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                var now = DateTime.Now;

                // Các khung giờ chạy task: 0h (Cleanup), 6h, 12h, 19h (Gửi Email)
                var targetHours = new[] { 0, 6, 12, 19 };
                DateTime? nextRun = null;

                foreach (var hour in targetHours)
                {
                    var target = new DateTime(now.Year, now.Month, now.Day, hour, 0, 0);
                    if (target > now)
                    {
                        nextRun = target;
                        break;
                    }
                }

                if (nextRun == null)
                {
                    // Nếu đã qua hết các khung giờ trong ngày, chọn 0h ngày mai
                    nextRun = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0).AddDays(1);
                }

                var delay = nextRun.Value - now;
                _logger.LogInformation("Next background task scheduled at {Time} (Delay: {Delay})", nextRun, delay);

                try
                {
                    await Task.Delay(delay, stoppingToken);
                }
                catch (TaskCanceledException)
                {
                    break;
                }

                if (!stoppingToken.IsCancellationRequested)
                {
                    var runHour = nextRun.Value.Hour;

                    // Task 1: Dọn dẹp hàng ngày lúc 0h
                    if (runHour == 0)
                    {
                        await PerformDailyCleanupAsync(stoppingToken);
                    }

                    // Task 2: Gửi email thông báo job mới lúc 6h, 12h, 19h
                    if (runHour == 6 || runHour == 12 || runHour == 19)
                    {
                        await SendScheduledEmailsAsync(stoppingToken);
                    }
                }
            }
        }

        private async Task SendScheduledEmailsAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Running scheduled job alert email task...");
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var subscriberService = scope.ServiceProvider.GetRequiredService<ISubscriberService>();
                await subscriberService.SendSubscribersEmailJobsAsync();
                _logger.LogInformation("Scheduled email alerts sent successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during scheduled email task.");
            }
        }

        private async Task PerformDailyCleanupAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Running daily cleanup tasks...");

            try
            {
                using var scope = _serviceProvider.CreateScope();
                var userService = scope.ServiceProvider.GetRequiredService<IUserService>();
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                // 1. Session Cleanup
                var expiredSessions = await context.UserSessions
                    .Where(s => s.ExpiresAt < DateTime.UtcNow)
                    .ToListAsync(stoppingToken);

                if (expiredSessions.Any())
                {
                    context.UserSessions.RemoveRange(expiredSessions);
                    _logger.LogInformation("Cleaned up {Count} expired sessions.", expiredSessions.Count);
                    await context.SaveChangesAsync(stoppingToken);
                }

                // 2. VIP Expiry and CV Submission count reset
                await userService.ResetVipAndCvCountsAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during daily cleanup tasks.");
            }
        }
    }
}
