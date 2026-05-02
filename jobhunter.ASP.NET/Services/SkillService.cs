using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using jobhunter.ASP.NET.Data;
using jobhunter.ASP.NET.DTOs.Request;
using jobhunter.ASP.NET.DTOs.Response;
using jobhunter.ASP.NET.Entities;
using jobhunter.ASP.NET.Middleware;
using jobhunter.ASP.NET.Models;

namespace jobhunter.ASP.NET.Services
{
    public interface ISkillService
    {
        Task<ResSkillDTO> CreateAsync(ReqCreateSkillDTO dto);
        Task<ResBulkCreateSkillDTO> BulkCreateAsync(List<ReqBulkCreateSkillDTO> dtos);
        Task<ResSkillDTO> UpdateAsync(ReqUpdateSkillDTO dto);
        Task DeleteAsync(long id);
        Task<PaginatedResponse<ResSkillDTO>> GetAllAsync(int page, int pageSize);
        Task<string> GetAllSkillNamesAsStringAsync();
    }

    public class SkillService : ISkillService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public SkillService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<ResSkillDTO> CreateAsync(ReqCreateSkillDTO dto)
        {
            if (await _context.Skills.AnyAsync(s => s.Name == dto.Name))
            {
                throw new IdInvalidException($"Skill name = {dto.Name} đã tồn tại");
            }

            var skill = new Skill { Name = dto.Name };
            _context.Skills.Add(skill);
            await _context.SaveChangesAsync();

            return _mapper.Map<ResSkillDTO>(skill);
        }

        public async Task<ResBulkCreateSkillDTO> BulkCreateAsync(List<ReqBulkCreateSkillDTO> dtos)
        {
            int total = dtos.Count;
            int success = 0;
            var failedSkills = new List<string>();

            foreach (var dto in dtos)
            {
                try
                {
                    if (await _context.Skills.AnyAsync(s => s.Name == dto.Name))
                    {
                        failedSkills.Add($"{dto.Name} (Skill đã tồn tại)");
                        continue;
                    }

                    var skill = new Skill { Name = dto.Name };
                    _context.Skills.Add(skill);
                    await _context.SaveChangesAsync();
                    success++;
                }
                catch (Exception e)
                {
                    failedSkills.Add($"{dto.Name} (Lỗi hệ thống: {e.Message})");
                }
            }

            return new ResBulkCreateSkillDTO
            {
                Total = total,
                Success = success,
                Failed = total - success,
                FailedSkills = failedSkills
            };
        }

        public async Task<ResSkillDTO> UpdateAsync(ReqUpdateSkillDTO dto)
        {
            var currentSkill = await _context.Skills.FindAsync(dto.Id)
                ?? throw new IdInvalidException($"Skill id = {dto.Id} không tồn tại");

            if (dto.Name != null && await _context.Skills.AnyAsync(s => s.Name == dto.Name && s.Id != dto.Id))
            {
                throw new IdInvalidException($"Skill name = {dto.Name} đã tồn tại");
            }

            currentSkill.Name = dto.Name;
            await _context.SaveChangesAsync();

            return _mapper.Map<ResSkillDTO>(currentSkill);
        }

        public async Task DeleteAsync(long id)
        {
            var currentSkill = await _context.Skills
                .Include(s => s.Jobs)
                .Include(s => s.Subscribers)
                .FirstOrDefaultAsync(s => s.Id == id)
                ?? throw new IdInvalidException($"Skill id = {id} không tồn tại");

            // Cascade-remove from many-to-many join tables before deleting
            foreach (var job in currentSkill.Jobs.ToList())
            {
                job.Skills.Remove(currentSkill);
            }

            foreach (var subscriber in currentSkill.Subscribers.ToList())
            {
                subscriber.Skills.Remove(currentSkill);
            }

            _context.Skills.Remove(currentSkill);
            await _context.SaveChangesAsync();
        }

        public async Task<PaginatedResponse<ResSkillDTO>> GetAllAsync(int page, int pageSize)
        {
            var query = _context.Skills.AsQueryable();

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(s => s.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ProjectTo<ResSkillDTO>(_mapper.ConfigurationProvider)
                .ToListAsync();

            return new PaginatedResponse<ResSkillDTO>
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

        /// <summary>
        /// Returns all skill names as a comma-separated string.
        /// Used by Gemini AI for CV scoring prompts.
        /// </summary>
        public async Task<string> GetAllSkillNamesAsStringAsync()
        {
            var skillNames = await _context.Skills
                .Select(s => s.Name)
                .ToListAsync();

            return skillNames.Count == 0 ? "" : string.Join(", ", skillNames);
        }
    }
}
