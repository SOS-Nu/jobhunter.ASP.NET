using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace jobhunter.ASP.NET.Entities
{
    /// <summary>
    /// Maps from: vn.hoidanit.jobhunter.domain.entity.Skill
    /// Table: skills
    /// </summary>
    [Table("skills")]
    public class Skill
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("id")]
        public long Id { get; set; }

        [Required(ErrorMessage = "name không được để trống")]
        [Column("name")]
        public string Name { get; set; } = null!;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        [Column("created_by")]
        public string? CreatedBy { get; set; }

        [Column("updated_by")]
        public string? UpdatedBy { get; set; }

        // Navigation: Many-to-Many with Job (inverse side)
        public virtual ICollection<Job> Jobs { get; set; } = new List<Job>();

        // Navigation: Many-to-Many with Subscriber (inverse side)
        public virtual ICollection<Subscriber> Subscribers { get; set; } = new List<Subscriber>();
    }
}
