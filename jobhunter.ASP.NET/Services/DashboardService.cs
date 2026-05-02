using Microsoft.EntityFrameworkCore;
using jobhunter.ASP.NET.Data;
using jobhunter.ASP.NET.DTOs.Response;
using jobhunter.ASP.NET.Enums;

namespace jobhunter.ASP.NET.Services
{
    public interface IDashboardService
    {
        Task<ResDashboardDTO> GetDashboardStatsAsync();
    }

    public class DashboardService : IDashboardService
    {
        private readonly AppDbContext _context;

        public DashboardService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ResDashboardDTO> GetDashboardStatsAsync()
        {
            var totalUsers = await _context.Users.LongCountAsync();
            var totalCompanies = await _context.Companies.LongCountAsync();
            var totalJobs = await _context.Jobs.LongCountAsync();
            var totalResumesApproved = await _context.Resumes
                .Where(r => r.Status == ResumeStateEnum.APPROVED)
                .LongCountAsync();

            return new ResDashboardDTO
            {
                TotalUsers = totalUsers,
                TotalCompanies = totalCompanies,
                TotalJobs = totalJobs,
                TotalResumesApproved = totalResumesApproved
            };
        }
    }
}
