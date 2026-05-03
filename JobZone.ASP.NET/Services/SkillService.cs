using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using JobZone.ASP.NET.Data;
using JobZone.ASP.NET.DTOs.Request;
using JobZone.ASP.NET.DTOs.Response;
using JobZone.ASP.NET.Entities;
using JobZone.ASP.NET.Middleware;
using JobZone.ASP.NET.Models;
using Sieve.Models;
using Sieve.Services;

namespace JobZone.ASP.NET.Services
{
    public interface ISkillService
    {
        Task<ResSkillDTO> CreateAsync(ReqCreateSkillDTO dto);
        Task<ResBulkCreateSkillDTO> BulkCreateAsync(List<ReqBulkCreateSkillDTO> dtos);
        Task<ResSkillDTO> UpdateAsync(ReqUpdateSkillDTO dto);
        Task DeleteAsync(long id);
        Task<PaginatedResponse<ResSkillDTO>> GetAllAsync(SieveModel sieveModel);
        Task<string> GetAllSkillNamesAsStringAsync();
    }

    public class SkillService : ISkillService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly ISieveProcessor _sieveProcessor;

        public SkillService(AppDbContext context, IMapper mapper, ISieveProcessor sieveProcessor)
        {
            _context = context;
            _mapper = mapper;
            _sieveProcessor = sieveProcessor;
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

        public async Task<PaginatedResponse<ResSkillDTO>> GetAllAsync(SieveModel sieveModel)
        {
            var query = _context.Skills.AsQueryable();

            query = _sieveProcessor.Apply(sieveModel, query, applyPagination: false);
            var total = await query.CountAsync();
            var paginatedQuery = _sieveProcessor.Apply(sieveModel, query, applyFiltering: false, applySorting: false, applyPagination: true);
            var items = await paginatedQuery
                .ProjectTo<ResSkillDTO>(_mapper.ConfigurationProvider)
                .ToListAsync();

            var page = sieveModel.Page ?? 1;
            var pageSize = sieveModel.PageSize ?? 10;

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
