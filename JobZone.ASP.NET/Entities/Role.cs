using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace JobZone.ASP.NET.Entities
{
    /// <summary>
    /// Maps from: vn.hoidanit.JobZone.domain.entity.Role
    /// Table: roles
    /// </summary>
    [Table("roles")]
    public class Role
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("id")]
        public long Id { get; set; }

        [Required(ErrorMessage = "name không được để trống")]
        [Column("name")]
        public string Name { get; set; } = null!;

        [Column("description")]
        public string? Description { get; set; }

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

        // Navigation properties
        public virtual ICollection<User> Users { get; set; } = new List<User>();

        // Many-to-Many with Permission (owning side)
        public virtual ICollection<Permission> Permissions { get; set; } = new List<Permission>();
    }
}
