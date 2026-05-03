using Microsoft.EntityFrameworkCore;
using JobZone.ASP.NET.Data;
using JobZone.ASP.NET.DTOs.Response;
using JobZone.ASP.NET.Entities;

namespace JobZone.ASP.NET.Services
{
    public interface ISubscriberService
    {
        Task<bool> IsExistsByEmailAsync(string email);
        Task<Subscriber> CreateAsync(Subscriber subs, List<long>? skillIds);
        Task<Subscriber> UpdateAsync(Subscriber subsDB, List<long>? skillIds);
        Task<Subscriber?> FindByIdAsync(long id);
        Task<Subscriber?> FindByEmailAsync(string email);
        Task SendSubscribersEmailJobsAsync();
    }

    public class SubscriberService : ISubscriberService
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;

        public SubscriberService(AppDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        public async Task<bool> IsExistsByEmailAsync(string email)
        {
            return await _context.Subscribers.AnyAsync(s => s.Email == email);
        }

        public async Task<Subscriber> CreateAsync(Subscriber subs, List<long>? skillIds)
        {
            if (skillIds != null && skillIds.Any())
            {
                var dbSkills = await _context.Skills.Where(s => skillIds.Contains(s.Id)).ToListAsync();
                subs.Skills = dbSkills;
            }

            _context.Subscribers.Add(subs);
            await _context.SaveChangesAsync();
            return subs;
        }

        public async Task<Subscriber> UpdateAsync(Subscriber subsDB, List<long>? skillIds)
        {
            if (skillIds != null)
            {
                var dbSkills = await _context.Skills.Where(s => skillIds.Contains(s.Id)).ToListAsync();
                
                // Clear existing and add new
                subsDB.Skills.Clear();
                foreach (var skill in dbSkills)
                {
                    subsDB.Skills.Add(skill);
                }
            }
            
            await _context.SaveChangesAsync();
            return subsDB;
        }

        public async Task<Subscriber?> FindByIdAsync(long id)
        {
            return await _context.Subscribers.Include(s => s.Skills).FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task<Subscriber?> FindByEmailAsync(string email)
        {
            return await _context.Subscribers.Include(s => s.Skills).FirstOrDefaultAsync(s => s.Email == email);
        }

        public async Task SendSubscribersEmailJobsAsync()
        {
            var subscribers = await _context.Subscribers.Include(s => s.Skills).ToListAsync();
            
            foreach (var sub in subscribers)
            {
                if (sub.Skills != null && sub.Skills.Any())
                {
                    var skillIds = sub.Skills.Select(s => s.Id).ToList();
                    
                    var matchingJobs = await _context.Jobs
                        .Include(j => j.Company)
                        .Include(j => j.Skills)
                        .Where(j => j.Active && j.Skills.Any(s => skillIds.Contains(s.Id)))
                        .ToListAsync();

                    if (matchingJobs.Any())
                    {
                        var emailJobs = matchingJobs.Select(j => new
                        {
                            Id = j.Id,
                            Name = j.Name,
                            Salary = j.Salary,
                            Company = new { Name = j.Company?.Name },
                            Skills = j.Skills.Select(s => new { Name = s.Name }).ToList()
                        }).ToList();

                        await _emailService.SendEmailFromTemplateAsync(
                            sub.Email,
                            "Cơ hội việc làm hot đang chờ đón bạn, khám phá ngay",
                            sub.Name,
                            emailJobs
                        );
                    }
                }
            }
        }
    }
}
