using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace johunter.ASP.NET.Entities
{
    public abstract class BaseEntity
    {
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string? CreatedBy { get; set; }
        public string? UpdatedBy { get; set; }
        public bool IsDeleted { get; set; }
    }

    [Table("subscribers")]
    public class Subscriber : BaseEntity
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long Id { get; set; }

        [Required(ErrorMessage = "email không được để trống")]
        public string Email { get; set; } = null!;

        [Required(ErrorMessage = "name không được để trống")]
        public string Name { get; set; } = null!;

        public virtual ICollection<Skill> Skills { get; set; } = new List<Skill>();
    }
}
