using jobhunter.ASP.NET.Enums;

namespace jobhunter.ASP.NET.DTOs.Request
{
    // ========================
    // AUTH DTOs
    // ========================
    public class ReqLoginDTO
    {
        public string Username { get; set; } = null!;
        public string Password { get; set; } = null!;
    }

    public class ReqUserRegisterDTO
    {
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
        public int Age { get; set; }
        public GenderEnum? Gender { get; set; }
        public string? Address { get; set; }
        public string OtpCode { get; set; } = null!;
    }

    public class ReqChangePasswordDTO
    {
        public string? OldPassword { get; set; }
        public string NewPassword { get; set; } = null!;
    }

    public class ReqSendOtpDTO
    {
        public string Email { get; set; } = null!;
    }

    public class ReqVerifyOtpChangePasswordDTO
    {
        public string Email { get; set; } = null!;
        public string OtpCode { get; set; } = null!;
        public string NewPassword { get; set; } = null!;
    }

    public class ReqLoginOtpDTO
    {
        public string Email { get; set; } = null!;
        public string OtpCode { get; set; } = null!;
        public string Password { get; set; } = null!;
    }

    public class ReqDeleteSessionsDTO
    {
        public List<long> Ids { get; set; } = new List<long>();
    }

    // ========================
    // USER DTOs
    // ========================
    public class ReqCreateUserDTO
    {
        public string? Name { get; set; }
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
        public int Age { get; set; }
        public bool Vip { get; set; }

        public GenderEnum? Gender { get; set; }
        public string? Address { get; set; }
        public CompanyRef? Company { get; set; }
        public RoleRef? Role { get; set; }
    }

    public class ReqUpdateUserDTO
    {
        public long Id { get; set; }
        public string? Name { get; set; }
        public int Age { get; set; }
        public GenderEnum? Gender { get; set; }
        public string? Address { get; set; }
        public string? Avatar { get; set; }
        public bool Vip { get; set; }
        public CompanyRef? Company { get; set; }
        public RoleRef? Role { get; set; }
    }

    public class ReqUpdateOwnUserDTO
    {
        public long Id { get; set; }
        public string? Name { get; set; }
        public int Age { get; set; }
        public GenderEnum? Gender { get; set; }
        public string? Address { get; set; }
        public string? Avatar { get; set; }
    }

    public class ReqUpdateIsPublicDTO
    {
        public bool Public { get; set; }
    }

    // ========================
    // COMPANY DTOs
    // ========================
    public class ReqCreateCompanyDTO
    {
        public string Name { get; set; } = null!;
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

    public class ReqUpdateCompanyDTO : ReqCreateCompanyDTO
    {
        public long Id { get; set; }
    }

    // ========================
    // JOB DTOs
    // ========================
    public class ReqCreateJobDTO
    {
        public string Name { get; set; } = null!;
        public string Location { get; set; } = null!;
        public string? Address { get; set; }
        public double Salary { get; set; }
        public int Quantity { get; set; }
        public LevelEnum? Level { get; set; }
        public string? Description { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool Active { get; set; }
        public List<SkillRef>? Skills { get; set; }
        public CompanyRef? Company { get; set; }
    }

    public class ReqUpdateJobDTO : ReqCreateJobDTO
    {
        public long Id { get; set; }
    }

    // ========================
    // RESUME DTOs
    // ========================
    public class ReqCreateResumeDTO
    {
        public string Email { get; set; } = null!;
        public string Url { get; set; } = null!;
        public string? CoverLetter { get; set; }
        public UserRef? User { get; set; }
        public JobRef? Job { get; set; }
    }

    public class ReqUpdateResumeDTO
    {
        public long Id { get; set; }
        public ResumeStateEnum? Status { get; set; }
    }

    // ========================
    // COMMENT DTOs
    // ========================
    public class ReqCreateCommentDTO
    {
        public string Comment { get; set; } = null!;
        public float Rating { get; set; }
        public long CompanyId { get; set; }
    }

    public class ReqUpdateCommentDTO
    {
        public long Id { get; set; }
        public string Comment { get; set; } = null!;
        public float Rating { get; set; }
    }

    // ========================
    // CHAT DTOs
    // ========================
    public class ChatNotificationDTO
    {
        public long Id { get; set; }
        public long SenderId { get; set; }
        public long ReceiverId { get; set; }
        public string? Content { get; set; }
        public DateTime TimeStamp { get; set; }
    }

    // ========================
    // PERMISSION DTOs
    // ========================
    public class ReqCreatePermissionDTO
    {
        public string Name { get; set; } = null!;
        public string ApiPath { get; set; } = null!;
        public string Method { get; set; } = null!;
        public string Module { get; set; } = null!;
    }

    public class ReqUpdatePermissionDTO : ReqCreatePermissionDTO
    {
        public long Id { get; set; }
    }

    // ========================
    // ROLE DTOs
    // ========================
    public class ReqCreateRoleDTO
    {
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public bool Active { get; set; }
        public List<PermissionRef>? Permissions { get; set; }
    }

    public class ReqUpdateRoleDTO : ReqCreateRoleDTO
    {
        public long Id { get; set; }
    }

    // ========================
    // SHARED REFs
    // ========================
    public class CompanyRef { public long Id { get; set; } }
    public class RoleRef { public long Id { get; set; } }
    public class SkillRef { public long Id { get; set; } }
    public class UserRef { public long Id { get; set; } }
    public class JobRef { public long Id { get; set; } }
    public class PermissionRef { public long Id { get; set; } }
}
