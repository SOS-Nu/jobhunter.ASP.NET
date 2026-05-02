using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace jobhunter.ASP.NET.Entities
{
    /// <summary>
    /// Maps from: vn.hoidanit.jobhunter.domain.entity.Company
    /// Table: companies
    /// </summary>
    [Table("companies")]
    public class Company
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("id")]
        public long Id { get; set; }

        [Required(ErrorMessage = "name không được để trống")]
        [Column("name")]
        public string Name { get; set; } = null!;

        [Column("description", TypeName = "NVARCHAR(MAX)")]
        public string? Description { get; set; }

        [Column("address")]
        public string? Address { get; set; }

        [Column("logo")]
        public string? Logo { get; set; }

        // THÊM CÁC TRƯỜNG MỚI
        [Column("field")]
        public string? Field { get; set; } // Lĩnh vực

        [Column("website")]
        public string? Website { get; set; }

        [Column("scale")]
        public string? Scale { get; set; } // Quy mô

        [Column("country")]
        public string? Country { get; set; } // Quốc gia

        [Column("founding_year")]
        public int FoundingYear { get; set; } // Năm thành lập

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

        [Column("is_deleted")]
        public bool IsDeleted { get; set; }

        // Navigation properties
        public virtual ICollection<User> Users { get; set; } = new List<User>();
        public virtual ICollection<Job> Jobs { get; set; } = new List<Job>();
    }
}
