using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace JobZone.ASP.NET.Entities
{
    /// <summary>
    /// Maps from: vn.hoidanit.JobZone.domain.entity.Comment (extends BaseEntity)
    /// Table: comments
    /// </summary>
    [Table("comments")]
    public class Comment
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("id")]
        public long Id { get; set; }

        [Column("comment", TypeName = "NVARCHAR(MAX)")]
        public string? Content { get; set; }

        [Range(1, 5, ErrorMessage = "Điểm đánh giá phải từ 1 đến 5")]
        [Column("rating")]
        public float Rating { get; set; }

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

        // Navigation: Many-to-One with User
        [Column("user_id")]
        public long? UserId { get; set; }
        public virtual User? User { get; set; }
    }
}
