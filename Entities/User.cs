using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using jobhunter.ASP.NET.Enums;

namespace jobhunter.ASP.NET.Entities
{
    /// <summary>
    /// Maps from: vn.hoidanit.jobhunter.domain.entity.User
    /// Table: users
    /// </summary>
    [Table("users")]
    public class User
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("id")]
        public long Id { get; set; }

        [Column("name")]
        public string? Name { get; set; }

        [Required(ErrorMessage = "email không được để trống")]
        [Column("email")]
        public string Email { get; set; } = null!;

        [Column("password")]
        public string? Password { get; set; }

        [Column("age")]
        public int Age { get; set; }

        [Column("main_resume")]
        public string? MainResume { get; set; }

        /// <summary>
        /// Stored as string in DB per agents.md rule 10
        /// </summary>
        [Column("gender")]
        public GenderEnum? Gender { get; set; }

        [Column("address")]
        public string? Address { get; set; }

        [Column("avatar")]
        public string? Avatar { get; set; }

        [Column("is_vip")]
        public bool IsVip { get; set; }

        [Column("vip_expiry_date")]
        public DateTime? VipExpiryDate { get; set; }

        [Column("cv_submission_count")]
        public int CvSubmissionCount { get; set; }

        [Column("is_public")]
        public bool IsPublic { get; set; } = true;

        /// <summary>
        /// Stored as string in DB per agents.md rule 10
        /// </summary>
        [Column("status")]
        public UserStatusEnum? Status { get; set; }

        [Column("last_security_update_at")]
        public DateTime? LastSecurityUpdateAt { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        [Column("created_by")]
        public string? CreatedBy { get; set; }

        [Column("updated_by")]
        public string? UpdatedBy { get; set; }

        // Navigation: Many-to-One with Company
        [Column("company_id")]
        public long? CompanyId { get; set; }
        public virtual Company? Company { get; set; }

        // Navigation: Many-to-One with Role
        [Column("role_id")]
        public long? RoleId { get; set; }
        public virtual Role? Role { get; set; }

        // Navigation: One-to-One with OnlineResume
        [Column("online_resume_id")]
        public long? OnlineResumeId { get; set; }
        public virtual OnlineResume? OnlineResume { get; set; }

        // Navigation: One-to-Many
        public virtual ICollection<Resume> Resumes { get; set; } = new List<Resume>();
        public virtual ICollection<UserSession> Sessions { get; set; } = new List<UserSession>();
        public virtual ICollection<PaymentHistory> PaymentHistories { get; set; } = new List<PaymentHistory>();
        public virtual ICollection<WorkExperience> WorkExperiences { get; set; } = new List<WorkExperience>();
    }
}
