using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using jobhunter.ASP.NET.Enums;

namespace jobhunter.ASP.NET.Entities
{
    /// <summary>
    /// Maps from: vn.hoidanit.jobhunter.domain.entity.PaymentHistory
    /// Table: payment_history
    /// </summary>
    [Table("payment_history")]
    public class PaymentHistory
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("id")]
        public long Id { get; set; }

        [Required]
        [Column("amount")]
        public long Amount { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("order_id")]
        public string OrderId { get; set; } = null!;

        /// <summary>
        /// Stored as string in DB per agents.md rule 10
        /// </summary>
        [Required]
        [Column("status")]
        public PaymentStatusEnum Status { get; set; }

        [MaxLength(10)]
        [Column("response_code")]
        public string? ResponseCode { get; set; }

        [Required]
        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        [Column("updated_by")]
        public string? UpdatedBy { get; set; }

        // Navigation: Many-to-One with User
        [Column("user_id")]
        public long UserId { get; set; }
        public virtual User User { get; set; } = null!;
    }
}
