using System.Text.Json.Serialization;
using jobhunter.ASP.NET.Enums;

namespace jobhunter.ASP.NET.DTOs.Response
{
    // ========================
    // AUTH RESPONSE DTOs
    // ========================
    public class ResLoginDTO
    {
        [JsonPropertyName("access_token")]
        public string? AccessToken { get; set; }
        public UserLoginDTO? User { get; set; }
    }

    public class UserLoginDTO
    {
        public long Id { get; set; }
        public string? Email { get; set; }
        public string? Name { get; set; }
        public GenderEnum? Gender { get; set; }
        public string? Address { get; set; }
        public int Age { get; set; }
        public string? Avatar { get; set; }
        public bool Public { get; set; }
        public RoleLoginDTO? Role { get; set; }
        public bool Vip { get; set; }
        public DateTime? VipExpiryDate { get; set; }
        public string? MainResume { get; set; }
        public CompanyLoginDTO? Company { get; set; }
    }

    /// <summary>
    /// Full Role DTO for login response (matches Spring Boot Role entity serialization).
    /// Spring Boot: @JsonIgnore on users, @JsonIgnoreProperties("roles") on permissions
    /// </summary>
    public class RoleLoginDTO
    {
        public long Id { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public bool Active { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? CreatedBy { get; set; }
        public string? UpdatedBy { get; set; }
        public List<PermissionLoginDTO>? Permissions { get; set; }
    }

    /// <summary>
    /// Permission DTO for login response (matches Spring Boot Permission entity).
    /// Spring Boot: @JsonIgnore on roles
    /// </summary>
    public class PermissionLoginDTO
    {
        public long Id { get; set; }
        public string? Name { get; set; }
        public string? ApiPath { get; set; }
        public string? Method { get; set; }
        public string? Module { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? CreatedBy { get; set; }
        public string? UpdatedBy { get; set; }
    }

    public class CompanyLoginDTO
    {
        public long Id { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? Address { get; set; }
        public string? Logo { get; set; }
        public string? Field { get; set; }
        public string? Website { get; set; }
        public string? Scale { get; set; }
        public string? Country { get; set; }
        public int FoundingYear { get; set; }
        public string? Location { get; set; }
    }

    public class UserGetAccountDTO
    {
        public UserLoginDTO? User { get; set; }
    }

    // ========================
    // USER RESPONSE DTOs
    // ========================
    public class ResCreateUserDTO
    {
        public long Id { get; set; }
        public string? Name { get; set; }
        public string? Email { get; set; }
        public GenderEnum? Gender { get; set; }
        public string? Address { get; set; }
        public int Age { get; set; }
        public string? Avatar { get; set; }
        public bool Vip { get; set; }
        public bool? Public { get; set; }

        public DateTime CreatedAt { get; set; }
        public CompanyShortDTO? Company { get; set; }
    }

    public class ResUpdateUserDTO
    {
        public long Id { get; set; }
        public string? Name { get; set; }
        public GenderEnum? Gender { get; set; }
        public string? Address { get; set; }
        public int Age { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? Avatar { get; set; }
        public bool Vip { get; set; }
        public bool? Public { get; set; }
        public CompanyShortDTO? Company { get; set; }
        public RoleShortDTO? Role { get; set; }
    }

    public class ResUserDTO
    {
        public long Id { get; set; }
        public string? Email { get; set; }
        public string? Name { get; set; }
        public GenderEnum? Gender { get; set; }
        public string? Address { get; set; }
        public int Age { get; set; }
        public string? Avatar { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool? Vip { get; set; }
        public bool? Public { get; set; }

        public CompanyShortDTO? Company { get; set; }
        public UserStatusEnum? Status { get; set; }
        public RoleShortDTO? Role { get; set; }
        public DateTime? LastSecurityUpdateAt { get; set; }
        public ResLastMessageDTO? LastMessage { get; set; }
    }

    public class ResUserDetailDTO
    {
        public long Id { get; set; }
        public string? Name { get; set; }
        public string? Email { get; set; }
        public int Age { get; set; }
        public GenderEnum? Gender { get; set; }
        public string? Address { get; set; }
        public string? MainResume { get; set; }
        public bool Public { get; set; }
        public string? Avatar { get; set; }

        public ResOnlineResumeDTO? OnlineResume { get; set; }
        public List<ResWorkExperienceDTO>? WorkExperiences { get; set; }
    }

    // ========================
    // COMPANY RESPONSE DTOs
    // ========================
    public class ResCreateCompanyDTO
    {
        public long Id { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? Address { get; set; }
        public string? Logo { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? Field { get; set; }
        public string? Website { get; set; }
        public string? Scale { get; set; }
        public string? Country { get; set; }
        public int FoundingYear { get; set; }
        public string? Location { get; set; }
    }

    public class ResFetchCompanyDTO
    {
        public long Id { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? Address { get; set; }
        public string? Logo { get; set; }
        public string? Field { get; set; }
        public string? Website { get; set; }
        public string? Scale { get; set; }
        public string? Country { get; set; }
        public int FoundingYear { get; set; }
        public string? Location { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? CreatedBy { get; set; }
        public string? UpdatedBy { get; set; }
        public long TotalJobs { get; set; }
        public HrCompanyDTO? HrCompany { get; set; }
        public double AverageRating { get; set; }
        public long TotalComments { get; set; }
        public bool Comment { get; set; }
    }

    public class HrCompanyDTO
    {
        public long Id { get; set; }
        public string? Name { get; set; }
        public string? Email { get; set; }
    }

    // ========================
    // JOB RESPONSE DTOs
    // ========================
    public class ResCreateJobDTO
    {
        public long Id { get; set; }
        public string? Name { get; set; }
        public double Salary { get; set; }
        public int Quantity { get; set; }
        public string? Location { get; set; }
        public LevelEnum? Level { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool Active { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? CreatedBy { get; set; }
        public string? Address { get; set; }
        public List<string>? Skills { get; set; }
    }

    public class ResUpdateJobDTO
    {
        public long Id { get; set; }
        public string? Name { get; set; }
        public double Salary { get; set; }
        public int Quantity { get; set; }
        public string? Location { get; set; }
        public LevelEnum? Level { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool Active { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? UpdatedBy { get; set; }
        public string? Address { get; set; }
        public List<string>? Skills { get; set; }
    }

    public class ResFetchJobDTO
    {
        public long Id { get; set; }
        public string? Name { get; set; }
        public string? Location { get; set; }
        public string? Address { get; set; }

        public double Salary { get; set; }
        public int Quantity { get; set; }
        public string? Level { get; set; }
        public string? Description { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool Active { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? CreatedBy { get; set; }
        public string? UpdatedBy { get; set; }
        [System.Text.Json.Serialization.JsonPropertyName("applied")]
        public bool IsApplied { get; set; }
        public CompanyInfoDTO? Company { get; set; }
        public List<SkillInfoDTO>? Skills { get; set; }
    }

    public class CompanyInfoDTO
    {
        public long Id { get; set; }
        public string? Name { get; set; }
        public string? Logo { get; set; }
    }

    public class SkillInfoDTO
    {
        public long Id { get; set; }
        public string? Name { get; set; }
    }

    // ========================
    // RESUME RESPONSE DTOs
    // ========================
    public class ResCreateResumeDTO
    {
        public long Id { get; set; }
        public string? CoverLetter { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class ResUpdateResumeDTO
    {
        public DateTime? UpdatedAt { get; set; }
        public string? UpdatedBy { get; set; }
    }

    public class ResFetchResumeDTO
    {
        public long Id { get; set; }
        public string? Email { get; set; }
        public string? Url { get; set; }
        public ResumeStateEnum? Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? UpdatedBy { get; set; }
        public string? CoverLetter { get; set; }
        public int Score { get; set; }
        public string? CompanyName { get; set; }
        public UserResumeDTO? User { get; set; }
        public JobResumeDTO? Job { get; set; }
    }

    public class UserResumeDTO
    {
        public long Id { get; set; }
        public string? Name { get; set; }
    }

    public class JobResumeDTO
    {
        public long Id { get; set; }
        public string? Name { get; set; }
    }

    // ========================
    // COMMENT RESPONSE DTOs
    // ========================
    public class ResCommentDTO
    {
        public long Id { get; set; }
        public string? Comment { get; set; }
        public float Rating { get; set; }
        public CommentUserInfoDTO? User { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? CreatedBy { get; set; }
    }

    public class CommentUserInfoDTO
    {
        public long Id { get; set; }
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Avatar { get; set; }
    }

    // ========================
    // CHAT RESPONSE DTOs
    // ========================
    public class ResChatMessageDTO
    {
        public long Id { get; set; }
        public string? Content { get; set; }
        public DateTime TimeStamp { get; set; }
        public UserInChatDTO? Sender { get; set; }
        public UserInChatDTO? Receiver { get; set; }
    }

    public class UserInChatDTO
    {
        public long Id { get; set; }
        public string? Name { get; set; }
        public string? Email { get; set; }
        public UserStatusEnum? Status { get; set; }
    }

    public class ResLastMessageDTO
    {
        public string? Content { get; set; }
        public long SenderId { get; set; }
        public DateTime Timestamp { get; set; }
    }

    // ========================
    // FILE DTOs
    // ========================
    public class ResUploadFileDTO
    {
        public string? FileName { get; set; }
        public DateTime UploadedAt { get; set; }
    }

    // ========================
    // SHARED SHORT DTOs
    // ========================
    public class CompanyShortDTO
    {
        public long Id { get; set; }
        public string? Name { get; set; }
    }

    public class RoleShortDTO
    {
        public long Id { get; set; }
        public string? Name { get; set; }
    }

    // ========================
    // PERMISSION RESPONSE DTOs (Maps from: PermissionDTO.java)
    // ========================
    public class ResPermissionDTO
    {
        public long Id { get; set; }
        public string? Name { get; set; }
        public string? ApiPath { get; set; }
        public string? Method { get; set; }
        public string? Module { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? CreatedBy { get; set; }
        public string? UpdatedBy { get; set; }
    }

    // ========================
    // ROLE RESPONSE DTOs (Maps from: RoleDTO.java)
    // ========================
    public class ResRoleDTO
    {
        public long Id { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public bool Active { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? CreatedBy { get; set; }
        public string? UpdatedBy { get; set; }
        public List<ResPermissionDTO>? Permissions { get; set; }
    }

    // ========================
    // WORK EXPERIENCE RESPONSE DTOs
    // ========================
    public class ResWorkExperienceDTO
    {
        public long Id { get; set; }
        public string? CompanyName { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? Description { get; set; }
        public string? Location { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? CreatedBy { get; set; }
        public string? UpdatedBy { get; set; }
    }

    // ========================
    // SKILL RESPONSE DTOs
    // ========================
    public class ResSkillDTO
    {
        public long Id { get; set; }
        public string? Name { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? CreatedBy { get; set; }
        public string? UpdatedBy { get; set; }
    }

    public class ResBulkCreateSkillDTO
    {
        public int Total { get; set; }
        public int Success { get; set; }
        public int Failed { get; set; }
        public List<string> FailedSkills { get; set; } = new List<string>();
    }

    // ========================
    // DASHBOARD RESPONSE DTOs
    // ========================
    public class ResDashboardDTO
    {
        public long TotalUsers { get; set; }
        public long TotalCompanies { get; set; }
        public long TotalJobs { get; set; }
        public long TotalResumesApproved { get; set; }
    }

    // ========================
    // PAYMENT RESPONSE DTOs
    // ========================
    public class ResPaymentUrlDTO
    {
        public string Url { get; set; } = null!;
    }

    public class ResPaymentCallbackDTO
    {
        public string? Status { get; set; }
        public string? Message { get; set; }
    }

    public class ResPaymentHistoryDTO
    {
        public long Id { get; set; }
        public string? UserEmail { get; set; }
        public long UserId { get; set; }
        public long Amount { get; set; }
        public string? OrderId { get; set; }
        public string? ResponseCode { get; set; }
        public string? Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? UpdatedBy { get; set; }
    }

    // ========================
    // ONLINE RESUME RESPONSE DTOs
    // ========================
    public class ResOnlineResumeDTO
    {
        public long Id { get; set; }
        public string? Title { get; set; }
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? Summary { get; set; }
        public string? Certifications { get; set; }
        public string? Educations { get; set; }
        public string? Languages { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? CreatedBy { get; set; }
        public string? UpdatedBy { get; set; }
        public List<SkillInfoDTO>? Skills { get; set; }
    }
}
