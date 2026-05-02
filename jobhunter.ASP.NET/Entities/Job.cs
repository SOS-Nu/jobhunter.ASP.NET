using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using jobhunter.ASP.NET.Enums;

namespace jobhunter.ASP.NET.Entities
{
    /// <summary>
    /// Maps from: vn.hoidanit.jobhunter.domain.entity.Job
    /// Table: jobs
    /// </summary>
    [Table("jobs")]
    public class Job
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("id")]
        public long Id { get; set; }

        [Required(ErrorMessage = "name không được để trống")]
        [Column("name")]
        public string Name { get; set; } = null!;

        [Required(ErrorMessage = "location không được để trống")]
        [Column("location")]
        public string Location { get; set; } = null!;

        [Column("address")]
        public string? Address { get; set; }

        [Column("salary")]
        public double Salary { get; set; }

        [Column("quantity")]
        public int Quantity { get; set; }

        /// <summary>
        /// Stored as string in DB per agents.md rule 10
        /// </summary>
        [Column("level")]
        public LevelEnum? Level { get; set; }

        [Column("description", TypeName = "NVARCHAR(MAX)")]
        public string? Description { get; set; }

        [Column("start_date")]
        public DateTime? StartDate { get; set; }

        [Column("end_date")]
        public DateTime? EndDate { get; set; }

        [Column("active")]
        public bool Active { get; set; }

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

        // Navigation: One-to-Many with Resume
        public virtual ICollection<Resume> Resumes { get; set; } = new List<Resume>();

        // Navigation: Many-to-Many with Skill (owning side)
        public virtual ICollection<Skill> Skills { get; set; } = new List<Skill>();
    }
}
