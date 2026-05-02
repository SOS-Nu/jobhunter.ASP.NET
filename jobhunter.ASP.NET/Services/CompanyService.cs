using AutoMapper;
using Microsoft.EntityFrameworkCore;
using jobhunter.ASP.NET.Data;
using jobhunter.ASP.NET.DTOs.Response;
using jobhunter.ASP.NET.Entities;
using jobhunter.ASP.NET.Middleware;
using jobhunter.ASP.NET.Models;

namespace jobhunter.ASP.NET.Services
{
    public interface ICompanyService
    {
        Task<Company> CreateCompanyAsync(Company company);
        Task<Company?> UpdateCompanyAsync(Company company);
        Task DeleteCompanyAsync(long id);
        Task<PaginatedResponse<ResFetchCompanyDTO>> GetAllCompaniesAsync(int page, int pageSize, string? filter);
        Task<ResFetchCompanyDTO?> GetCompanyByIdAsync(long id);
        Task<ResCreateCompanyDTO> CreateCompanyByUserAsync(DTOs.Request.ReqCreateCompanyDTO req);
        Task<Company> UpdateCompanyByUserAsync(DTOs.Request.ReqUpdateCompanyDTO req);
        Task DeleteCompanyByUserAsync();
    }

    public class CompanyService : ICompanyService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly ICurrentUserService _currentUserService;

        public CompanyService(AppDbContext context, IMapper mapper, ICurrentUserService currentUserService)
        {
            _context = context;
            _mapper = mapper;
            _currentUserService = currentUserService;
        }

        public async Task<Company> CreateCompanyAsync(Company company)
        {
            _context.Companies.Add(company);
            await _context.SaveChangesAsync();
            return company;
        }

        public async Task<Company?> UpdateCompanyAsync(Company c)
        {
            var current = await _context.Companies.FindAsync(c.Id);
            if (current == null) return null;
            current.Name = c.Name; current.Description = c.Description; current.Address = c.Address;
            current.Logo = c.Logo; current.Field = c.Field; current.Website = c.Website;
            current.Scale = c.Scale; current.Country = c.Country; current.FoundingYear = c.FoundingYear;
            current.Location = c.Location;
            await _context.SaveChangesAsync();
            return current;
        }

        public async Task DeleteCompanyAsync(long id)
        {
            var users = await _context.Users.Where(u => u.CompanyId == id).ToListAsync();
            _context.Users.RemoveRange(users);
            var company = await _context.Companies.FindAsync(id);
            if (company != null) _context.Companies.Remove(company);
            await _context.SaveChangesAsync();
        }

        public async Task<PaginatedResponse<ResFetchCompanyDTO>> GetAllCompaniesAsync(int page, int pageSize, string? filter)
        {
            var query = _context.Companies.AsQueryable();
            if (!string.IsNullOrEmpty(filter))
                query = query.Where(c => c.Name.Contains(filter));

            var total = await query.CountAsync();
            var items = await query.OrderByDescending(c => c.CreatedAt).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
            var dtos = items.Select(c => { 
                var d = _mapper.Map<ResFetchCompanyDTO>(c); 
                d.TotalJobs = _context.Jobs.Count(j => j.CompanyId == c.Id && j.Active); 
                
                var comments = _context.Comments.Where(cmt => cmt.CompanyId == c.Id).ToList();
                d.TotalComments = comments.Count;
                d.AverageRating = comments.Count > 0 ? Math.Round(comments.Average(cmt => cmt.Rating), 1) : 0;

                // HR company user (matching Java: the employer who owns this company)
                var hrUser = _context.Users.FirstOrDefault(u => u.CompanyId == c.Id && u.Role != null && u.Role.Name == "EMPLOYER");
                if (hrUser != null)
                {
                    d.HrCompany = new HrCompanyDTO { Id = hrUser.Id, Name = hrUser.Name, Email = hrUser.Email };
                }
                
                return d; 
            }).ToList();

            return new PaginatedResponse<ResFetchCompanyDTO> { Meta = new PaginationMeta { Page = page, PageSize = pageSize, Pages = (int)Math.Ceiling((double)total / pageSize), Total = total }, Result = dtos };
        }

        public async Task<ResFetchCompanyDTO?> GetCompanyByIdAsync(long id)
        {
            var company = await _context.Companies.FindAsync(id);
            if (company == null) return null;
            var dto = _mapper.Map<ResFetchCompanyDTO>(company);
            dto.TotalJobs = await _context.Jobs.CountAsync(j => j.CompanyId == id && j.Active);

            var comments = await _context.Comments.Where(c => c.CompanyId == id).ToListAsync();
            dto.TotalComments = comments.Count;
            dto.AverageRating = comments.Count > 0 ? Math.Round(comments.Average(c => c.Rating), 1) : 0;

            // Check if current user has an approved resume for this company
            var email = _currentUserService.GetCurrentUserEmail();
            if (!string.IsNullOrEmpty(email))
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
                if (user != null)
                {
                    bool hasApprovedResume = await _context.Resumes
                        .Include(r => r.Job)
                        .AnyAsync(r => r.UserId == user.Id && r.Job != null && r.Job.CompanyId == id && r.Status == Enums.ResumeStateEnum.APPROVED);
                    bool hasCommented = await _context.Comments.AnyAsync(c => c.UserId == user.Id && c.CompanyId == id);
                    dto.IsComment = hasApprovedResume && !hasCommented;
                }
            }

            return dto;
        }

        public async Task<ResCreateCompanyDTO> CreateCompanyByUserAsync(DTOs.Request.ReqCreateCompanyDTO req)
        {
            var email = _currentUserService.GetCurrentUserEmail() ?? throw new IdInvalidException("Không tìm thấy người dùng");
            var user = await _context.Users.Include(u => u.Company).FirstOrDefaultAsync(u => u.Email == email) ?? throw new IdInvalidException("Người dùng không tồn tại");
            if (!user.IsVip) throw new IdInvalidException("Bạn cần là tài khoản VIP để tạo công ty");
            // VIP expiry check (matching Java: additional date comparison logic)
            if (user.VipExpiryDate.HasValue && user.VipExpiryDate.Value < DateTime.UtcNow)
            {
                throw new IdInvalidException("Tài khoản VIP của bạn đã hết hạn. Vui lòng gia hạn.");
            }
            if (user.CompanyId != null) throw new IdInvalidException("Bạn đã tạo một công ty. Mỗi người dùng chỉ được tạo một công ty");

            var company = new Company { Name = req.Name, Description = req.Description, Address = req.Address, Logo = req.Logo, Field = req.Field, Website = req.Website, Scale = req.Scale, Country = req.Country, FoundingYear = req.FoundingYear, Location = req.Location };
            _context.Companies.Add(company);
            await _context.SaveChangesAsync();

            user.CompanyId = company.Id;
            var employerRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "EMPLOYER") ?? throw new IdInvalidException("Role EMPLOYER không tồn tại");
            user.RoleId = employerRole.Id;
            await _context.SaveChangesAsync();
            return _mapper.Map<ResCreateCompanyDTO>(company);
        }

        public async Task<Company> UpdateCompanyByUserAsync(DTOs.Request.ReqUpdateCompanyDTO req)
        {
            var email = _currentUserService.GetCurrentUserEmail() ?? throw new IdInvalidException("Không tìm thấy thông tin đăng nhập");
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email) ?? throw new IdInvalidException("Người dùng không tồn tại");
            if (user.CompanyId == null) throw new IdInvalidException("Bạn chưa tạo công ty. Không thể cập nhật.");
            var company = await _context.Companies.FindAsync(user.CompanyId.Value) ?? throw new IdInvalidException($"Công ty không tồn tại");
            company.Name = req.Name; company.Description = req.Description; company.Address = req.Address; company.Logo = req.Logo;
            company.Field = req.Field; company.Website = req.Website; company.Scale = req.Scale; company.Country = req.Country;
            company.FoundingYear = req.FoundingYear; company.Location = req.Location;
            await _context.SaveChangesAsync();
            return company;
        }

        public async Task DeleteCompanyByUserAsync()
        {
            var email = _currentUserService.GetCurrentUserEmail() ?? throw new IdInvalidException("Không tìm thấy thông tin đăng nhập");
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email) ?? throw new IdInvalidException("Người dùng không tồn tại");
            if (user.CompanyId == null) throw new IdInvalidException("Bạn không có quyền xóa công ty này");
            var companyId = user.CompanyId.Value;
            var userRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "USER") ?? throw new IdInvalidException("Role USER không tồn tại");
            user.CompanyId = null; user.RoleId = userRole.Id;
            await _context.SaveChangesAsync();
            var company = await _context.Companies.FindAsync(companyId);
            if (company != null) { _context.Companies.Remove(company); await _context.SaveChangesAsync(); }
        }
    }
}
