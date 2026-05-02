using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace jobhunter.ASP.NET.Entities
{
    /// <summary>
    /// Maps from: vn.hoidanit.jobhunter.domain.entity.Subscriber
    /// Table: subscribers
    /// </summary>
    [Table("subscribers")]
    public class Subscriber
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("id")]
        public long Id { get; set; }

        [Required(ErrorMessage = "email không được để trống")]
        [Column("email")]
        public string Email { get; set; } = null!;

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

        // Navigation: Many-to-Many with Skill (owning side)
        public virtual ICollection<Skill> Skills { get; set; } = new List<Skill>();
    }
}
