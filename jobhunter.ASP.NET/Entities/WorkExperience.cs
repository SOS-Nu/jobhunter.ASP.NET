using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace jobhunter.ASP.NET.Entities
{
    /// <summary>
    /// Maps from: vn.hoidanit.jobhunter.domain.entity.WorkExperience (extends BaseEntity)
    /// Table: work_experiences
    /// </summary>
    [Table("work_experiences")]
    public class WorkExperience
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("id")]
        public long Id { get; set; }

        [Required(ErrorMessage = "Tên công ty không được để trống")]
        [Column("company_name")]
        public string CompanyName { get; set; } = null!;

        [Column("start_date")]
        public DateTime? StartDate { get; set; }

        [Column("end_date")]
        public DateTime? EndDate { get; set; }

        [Column("description", TypeName = "NVARCHAR(MAX)")]
        public string? Description { get; set; }

        [Column("location")]
        public string? Location { get; set; }

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
    }
}
