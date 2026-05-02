using AutoMapper;
using Microsoft.EntityFrameworkCore;
using jobhunter.ASP.NET.Data;
using jobhunter.ASP.NET.DTOs.Request;
using jobhunter.ASP.NET.DTOs.Response;
using jobhunter.ASP.NET.Entities;
using jobhunter.ASP.NET.Middleware;
using jobhunter.ASP.NET.Models;

namespace jobhunter.ASP.NET.Services
{
    public interface ICommentService
    {
        Task<ResCommentDTO> CreateCommentAsync(ReqCreateCommentDTO commentDTO);
        Task<ResCommentDTO> UpdateCommentAsync(ReqUpdateCommentDTO reqComment);
        Task<PaginatedResponse<ResCommentDTO>> GetCommentsByCompanyAsync(long companyId, int page, int pageSize);
    }

    public class CommentService : ICommentService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly ICurrentUserService _currentUserService;

        public CommentService(AppDbContext context, IMapper mapper, ICurrentUserService currentUserService)
        {
            _context = context;
            _mapper = mapper;
            _currentUserService = currentUserService;
        }

        public async Task<ResCommentDTO> CreateCommentAsync(ReqCreateCommentDTO commentDTO)
        {
            var email = _currentUserService.GetCurrentUserEmail()
                ?? throw new IdInvalidException("Không tìm thấy người dùng");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email)
                ?? throw new IdInvalidException("Người dùng không tồn tại");

            var company = await _context.Companies.FindAsync(commentDTO.CompanyId)
                ?? throw new IdInvalidException($"Công ty với id = {commentDTO.CompanyId} không tồn tại");

            bool exists = await _context.Comments.AnyAsync(c => c.UserId == user.Id && c.CompanyId == company.Id);
            if (exists)
            {
                throw new IdInvalidException("Bạn đã gửi đánh giá cho công ty này rồi.");
            }

            var comment = new Comment
            {
                Content = commentDTO.Comment,
                Rating = commentDTO.Rating,
                CompanyId = company.Id,
                Company = company,
                UserId = user.Id,
                User = user
            };

            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();

            return _mapper.Map<ResCommentDTO>(comment);
        }

        public async Task<ResCommentDTO> UpdateCommentAsync(ReqUpdateCommentDTO reqComment)
        {
            var commentInDb = await _context.Comments.Include(c => c.User).FirstOrDefaultAsync(c => c.Id == reqComment.Id)
                ?? throw new IdInvalidException("Bình luận không tồn tại");

            var currentEmail = _currentUserService.GetCurrentUserEmail()
                ?? throw new IdInvalidException("Vui lòng đăng nhập để thực hiện tác vụ này");

            if (commentInDb.User?.Email != currentEmail)
            {
                throw new IdInvalidException("Bạn không có quyền chỉnh sửa bình luận này");
            }

            commentInDb.Content = reqComment.Comment;
            commentInDb.Rating = reqComment.Rating;

            await _context.SaveChangesAsync();
            return _mapper.Map<ResCommentDTO>(commentInDb);
        }

        public async Task<PaginatedResponse<ResCommentDTO>> GetCommentsByCompanyAsync(long companyId, int page, int pageSize)
        {
            if (!await _context.Companies.AnyAsync(c => c.Id == companyId))
            {
                throw new IdInvalidException($"Công ty với id = {companyId} không tồn tại");
            }

            var query = _context.Comments
                .Include(c => c.User)
                .Where(c => c.CompanyId == companyId);

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(c => c.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var dtos = _mapper.Map<List<ResCommentDTO>>(items);

            return new PaginatedResponse<ResCommentDTO>
            {
                Meta = new PaginationMeta
                {
                    Page = page,
                    PageSize = pageSize,
                    Pages = (int)Math.Ceiling((double)total / pageSize),
                    Total = total
                },
                Result = dtos
            };
        }
    }
}
