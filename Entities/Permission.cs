using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace jobhunter.ASP.NET.Entities
{
    /// <summary>
    /// Maps from: vn.hoidanit.jobhunter.domain.entity.Permission
    /// Table: permissions
    /// </summary>
    [Table("permissions")]
    public class Permission
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("id")]
        public long Id { get; set; }

        [Required(ErrorMessage = "name không được để trống")]
        [Column("name")]
        public string Name { get; set; } = null!;

        [Required(ErrorMessage = "apiPath không được để trống")]
        [Column("api_path")]
        public string ApiPath { get; set; } = null!;

        [Required(ErrorMessage = "method không được để trống")]
        [Column("method")]
        public string Method { get; set; } = null!;

        [Required(ErrorMessage = "module không được để trống")]
        [Column("module")]
        public string Module { get; set; } = null!;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        [Column("created_by")]
        public string? CreatedBy { get; set; }

        [Column("updated_by")]
        public string? UpdatedBy { get; set; }

        // Navigation: Many-to-Many with Role (inverse side)
        public virtual ICollection<Role> Roles { get; set; } = new List<Role>();
    }
}
