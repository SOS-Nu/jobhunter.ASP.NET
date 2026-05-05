using AutoMapper;
using JobZone.ASP.NET.DTOs.Response;
using JobZone.ASP.NET.Entities;

namespace JobZone.ASP.NET.Mappings
{
    /// <summary>
    /// AutoMapper profile for all entity-to-DTO mappings.
    /// Replaces manual conversion methods from Spring Boot services.
    /// </summary>
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // User -> ResCreateUserDTO
            CreateMap<User, ResCreateUserDTO>()
                .ForMember(d => d.Vip, opt => opt.MapFrom(s => s.IsVip))
                .ForMember(d => d.Public, opt => opt.MapFrom(s => s.IsPublic))
                .ForMember(d => d.Company, opt => opt.MapFrom(s =>
                    s.Company != null ? new CompanyShortDTO { Id = s.Company.Id, Name = s.Company.Name } : null));

            // User -> ResUpdateUserDTO
            CreateMap<User, ResUpdateUserDTO>()
                .ForMember(d => d.Vip, opt => opt.MapFrom(s => s.IsVip))
                .ForMember(d => d.Public, opt => opt.MapFrom(s => s.IsPublic))
                .ForMember(d => d.Company, opt => opt.MapFrom(s =>
                    s.Company != null ? new CompanyShortDTO { Id = s.Company.Id, Name = s.Company.Name } : null))
                .ForMember(d => d.Role, opt => opt.MapFrom(s =>
                    s.Role != null ? new RoleShortDTO { Id = s.Role.Id, Name = s.Role.Name } : null));

            // User -> ResUserDTO
            CreateMap<User, ResUserDTO>()
                .ForMember(d => d.Vip, opt => opt.MapFrom(s => s.IsVip))
                .ForMember(d => d.Public, opt => opt.MapFrom(s => s.IsPublic))
                .ForMember(d => d.Company, opt => opt.MapFrom(s =>
                    s.Company != null ? new CompanyShortDTO { Id = s.Company.Id, Name = s.Company.Name } : null))
                .ForMember(d => d.Role, opt => opt.MapFrom(s =>
                    s.Role != null ? new RoleShortDTO { Id = s.Role.Id, Name = s.Role.Name } : null));

            // User -> ResUserDetailDTO
            CreateMap<User, ResUserDetailDTO>()
                .ForMember(d => d.Public, opt => opt.MapFrom(s => s.IsPublic))
                .ForMember(d => d.Email, opt => opt.MapFrom(s => s.IsPublic ? s.Email : null))
                .ForMember(d => d.Address, opt => opt.MapFrom(s => s.IsPublic ? s.Address : null));

            // User -> UserLoginDTO (for auth responses)
            CreateMap<User, UserLoginDTO>()
                .ForMember(d => d.Vip, opt => opt.MapFrom(s => s.IsVip))
                .ForMember(d => d.Public, opt => opt.MapFrom(s => s.IsPublic))
                .ForMember(d => d.Role, opt => opt.MapFrom(s =>
                    s.Role != null ? new RoleLoginDTO
                    {
                        Id = s.Role.Id,
                        Name = s.Role.Name,
                        Description = s.Role.Description,
                        Active = s.Role.Active,
                        CreatedAt = s.Role.CreatedAt,
                        UpdatedAt = s.Role.UpdatedAt,
                        CreatedBy = s.Role.CreatedBy,
                        UpdatedBy = s.Role.UpdatedBy,
                        Permissions = s.Role.Permissions.Select(p => new PermissionLoginDTO
                        {
                            Id = p.Id,
                            Name = p.Name,
                            ApiPath = p.ApiPath,
                            Method = p.Method,
                            Module = p.Module,
                            CreatedAt = p.CreatedAt,
                            UpdatedAt = p.UpdatedAt,
                            CreatedBy = p.CreatedBy,
                            UpdatedBy = p.UpdatedBy
                        }).ToList()
                    } : null))
                .ForMember(d => d.Company, opt => opt.MapFrom(s =>
                    s.Company != null ? new CompanyLoginDTO
                    {
                        Id = s.Company.Id,
                        Name = s.Company.Name,
                        Description = s.Company.Description,
                        Address = s.Company.Address,
                        Logo = s.Company.Logo,
                        Field = s.Company.Field,
                        Website = s.Company.Website,
                        Scale = s.Company.Scale,
                        Country = s.Company.Country,
                        FoundingYear = s.Company.FoundingYear,
                        Location = s.Company.Location
                    } : null));

            // Company -> ResCreateCompanyDTO
            CreateMap<Company, ResCreateCompanyDTO>();

            // Company -> ResFetchCompanyDTO
            CreateMap<Company, ResFetchCompanyDTO>();


            // ReqCreateJobDTO -> Job (for admin job creation)
            CreateMap<DTOs.Request.ReqCreateJobDTO, Job>()
                .ForMember(d => d.Id, opt => opt.Ignore())
                .ForMember(d => d.Skills, opt => opt.Ignore())
                .ForMember(d => d.Company, opt => opt.Ignore())
                .ForMember(d => d.CompanyId, opt => opt.Ignore())
                .ForMember(d => d.CreatedAt, opt => opt.Ignore())
                .ForMember(d => d.UpdatedAt, opt => opt.Ignore())
                .ForMember(d => d.CreatedBy, opt => opt.Ignore())
                .ForMember(d => d.UpdatedBy, opt => opt.Ignore())
                .ForMember(d => d.Resumes, opt => opt.Ignore());

            // Job -> ResCreateJobDTO
            CreateMap<Job, ResCreateJobDTO>()
                .ForMember(d => d.Skills, opt => opt.MapFrom(s =>
                    s.Skills != null ? s.Skills.Select(sk => sk.Name).ToList() : null));

            // Job -> ResUpdateJobDTO
            CreateMap<Job, ResUpdateJobDTO>()
                .ForMember(d => d.Skills, opt => opt.MapFrom(s =>
                    s.Skills != null ? s.Skills.Select(sk => sk.Name).ToList() : null));

            // Job -> ResFetchJobDTO
            CreateMap<Job, ResFetchJobDTO>()
                .ForMember(d => d.Level, opt => opt.MapFrom(s => s.Level != null ? s.Level.ToString() : null))
                .ForMember(d => d.Company, opt => opt.MapFrom(s =>
                    s.Company != null ? new CompanyInfoDTO { Id = s.Company.Id, Name = s.Company.Name, Logo = s.Company.Logo } : null))
                .ForMember(d => d.Skills, opt => opt.MapFrom(s =>
                    s.Skills != null ? s.Skills.Select(sk => new SkillInfoDTO { Id = sk.Id, Name = sk.Name }).ToList() : null));

            // Resume -> ResCreateResumeDTO
            CreateMap<Resume, ResCreateResumeDTO>();

            // Resume -> ResUpdateResumeDTO
            CreateMap<Resume, ResUpdateResumeDTO>();

            // Resume -> ResFetchResumeDTO
            CreateMap<Resume, ResFetchResumeDTO>()
                .ForMember(d => d.CompanyName, opt => opt.MapFrom(s =>
                    s.Job != null && s.Job.Company != null ? s.Job.Company.Name : null))
                .ForMember(d => d.User, opt => opt.MapFrom(s =>
                    s.User != null ? new UserResumeDTO { Id = s.User.Id, Name = s.User.Name } : null))
                .ForMember(d => d.Job, opt => opt.MapFrom(s =>
                    s.Job != null ? new JobResumeDTO { Id = s.Job.Id, Name = s.Job.Name } : null));

            // Comment -> ResCommentDTO
            CreateMap<Comment, ResCommentDTO>()
                .ForMember(d => d.Comment, opt => opt.MapFrom(s => s.CommentContent))
                .ForMember(d => d.User, opt => opt.MapFrom(s =>
                    s.User != null ? new CommentUserInfoDTO { Id = s.User.Id, Name = s.User.Name, Email = s.User.Email, Avatar = s.User.Avatar } : null));

            // WorkExperience -> ResWorkExperienceDTO
            CreateMap<WorkExperience, ResWorkExperienceDTO>();

            // Skill -> ResSkillDTO
            CreateMap<Skill, ResSkillDTO>();

            // OnlineResume -> ResOnlineResumeDTO
            CreateMap<OnlineResume, ResOnlineResumeDTO>()
                .ForMember(d => d.Skills, opt => opt.MapFrom(s =>
                    s.Skills != null ? s.Skills.Select(sk => new SkillInfoDTO { Id = sk.Id, Name = sk.Name }).ToList() : null));

            // PaymentHistory -> ResPaymentHistoryDTO
            CreateMap<PaymentHistory, ResPaymentHistoryDTO>()
                .ForMember(d => d.UserEmail, opt => opt.MapFrom(s => s.User != null ? s.User.Email : null))
                .ForMember(d => d.UserId, opt => opt.MapFrom(s => s.User != null ? s.User.Id : 0))
                .ForMember(d => d.Status, opt => opt.MapFrom(s => s.Status.ToString()));
        }
    }
}
