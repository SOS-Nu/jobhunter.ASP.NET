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
                // Run daily tasks at 1 AM
                var now = DateTime.Now;
                var nextRun = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0);
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
                var userService = scope.ServiceProvider.GetRequiredService<IUserService>();
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                // 1. Session Cleanup (Keep it here or move to UserService)
                var expiredSessions = await context.UserSessions
                    .Where(s => s.ExpiresAt < DateTime.UtcNow)
                    .ToListAsync(stoppingToken);

                if (expiredSessions.Any())
                {
                    context.UserSessions.RemoveRange(expiredSessions);
                    _logger.LogInformation("Cleaned up {Count} expired sessions.", expiredSessions.Count);
                    await context.SaveChangesAsync(stoppingToken);
                }

                // 2. VIP Expiry and CV Submission count reset (Logic moved to UserService)
                await userService.ResetVipAndCvCountsAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during daily cleanup tasks.");
            }
        }
    }
}
