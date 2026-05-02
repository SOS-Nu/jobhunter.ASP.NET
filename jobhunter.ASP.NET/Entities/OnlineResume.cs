using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace jobhunter.ASP.NET.Entities
{
    /// <summary>
    /// Maps from: vn.hoidanit.jobhunter.domain.entity.OnlineResume (extends BaseEntity)
    /// Table: online_resumes
    /// </summary>
    [Table("online_resumes")]
    public class OnlineResume
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("id")]
        public long Id { get; set; }

        [Required]
        [Column("title")]
        public string Title { get; set; } = null!;

        [Required]
        [Column("full_name")]
        public string FullName { get; set; } = null!;

        [Required]
        [EmailAddress]
        [Column("email")]
        public string Email { get; set; } = null!;

        [Column("phone")]
        public string? Phone { get; set; }

        [Column("date_of_birth")]
        public DateTime? DateOfBirth { get; set; }

        [Column("address")]
        public string? Address { get; set; }

        [Column("summary", TypeName = "NVARCHAR(MAX)")]
        public string? Summary { get; set; }

        [Column("certifications", TypeName = "NVARCHAR(MAX)")]
        public string? Certifications { get; set; }

        [Column("educations", TypeName = "NVARCHAR(MAX)")]
        public string? Educations { get; set; }

        [Column("languages", TypeName = "NVARCHAR(MAX)")]
        public string? Languages { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        [Column("created_by")]
        public string? CreatedBy { get; set; }

        [Column("updated_by")]
        public string? UpdatedBy { get; set; }

        // Navigation: One-to-One with User (inverse side)
        public virtual User? User { get; set; }

        // Navigation: Many-to-Many with Skill
        public virtual ICollection<Skill> Skills { get; set; } = new List<Skill>();
    }
}
