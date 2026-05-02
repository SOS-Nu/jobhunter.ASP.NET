using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using jobhunter.ASP.NET.Enums;

namespace jobhunter.ASP.NET.Entities
{
    /// <summary>
    /// Maps from: vn.hoidanit.jobhunter.domain.entity.Resume
    /// Table: resumes
    /// </summary>
    [Table("resumes")]
    public class Resume
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("id")]
        public long Id { get; set; }

        [Required(ErrorMessage = "email không được để trống")]
        [Column("email")]
        public string Email { get; set; } = null!;

        [Required(ErrorMessage = "url không được để trống (upload cv chưa thành công)")]
        [Column("url")]
        public string Url { get; set; } = null!;

        /// <summary>
        /// Stored as string in DB per agents.md rule 10
        /// </summary>
        [Column("status")]
        public ResumeStateEnum? Status { get; set; }

        [Column("cover_letter")]
        public string? CoverLetter { get; set; }

        [Column("score")]
        public int Score { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        [Column("created_by")]
        public string? CreatedBy { get; set; }

        [Column("updated_by")]
        public string? UpdatedBy { get; set; }

        // Navigation: Many-to-One with User
        [Column("user_id")]
        public long? UserId { get; set; }
        public virtual User? User { get; set; }

        // Navigation: Many-to-One with Job
        [Column("job_id")]
        public long? JobId { get; set; }
        public virtual Job? Job { get; set; }
    }
}
