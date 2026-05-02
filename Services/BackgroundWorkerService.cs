using Microsoft.EntityFrameworkCore;
using jobhunter.ASP.NET.Data;

namespace jobhunter.ASP.NET.Services
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
                // Run daily tasks at 1 AM
                var now = DateTime.Now;
                var nextRun = new DateTime(now.Year, now.Month, now.Day, 1, 0, 0);
                if (now > nextRun)
                {
                    nextRun = nextRun.AddDays(1);
                }

                var delay = nextRun - now;
                _logger.LogInformation("Next background task run scheduled in {Delay}", delay);

                await Task.Delay(delay, stoppingToken);

                if (!stoppingToken.IsCancellationRequested)
                {
                    await PerformDailyCleanupAsync(stoppingToken);
                }
            }
        }

        private async Task PerformDailyCleanupAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Running daily cleanup tasks...");

            try
            {
                using var scope = _serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                // 1. Session Cleanup
                var expiredSessions = await context.UserSessions
                    .Where(s => s.ExpiresAt < DateTime.UtcNow)
                    .ToListAsync(stoppingToken);

                if (expiredSessions.Any())
                {
                    context.UserSessions.RemoveRange(expiredSessions);
                    _logger.LogInformation("Cleaned up {Count} expired sessions.", expiredSessions.Count);
                }

                // 2. VIP Expiry and CV Submission count reset (run on the 1st of month)
                if (DateTime.Now.Day == 1)
                {
                    var users = await context.Users.ToListAsync(stoppingToken);
                    int resetCount = 0;
                    int expiredVipCount = 0;

                    foreach (var user in users)
                    {
                        if (user.CvSubmissionCount > 0)
                        {
                            user.CvSubmissionCount = 0;
                            resetCount++;
                        }

                        if (user.IsVip && user.VipExpiryDate.HasValue && user.VipExpiryDate.Value < DateTime.UtcNow)
                        {
                            user.IsVip = false;
                            user.VipExpiryDate = null;
                            expiredVipCount++;
                        }
                    }
                    _logger.LogInformation("Reset CV counts for {ResetCount} users. Deactivated {ExpiredCount} expired VIPs.", resetCount, expiredVipCount);
                }

                await context.SaveChangesAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during daily cleanup tasks.");
            }
        }
    }
}
