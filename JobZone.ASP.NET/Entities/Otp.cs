using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace JobZone.ASP.NET.Entities
{
    /// <summary>
    /// Maps from: vn.hoidanit.JobZone.domain.entity.Otp
    /// Table: otps
    /// </summary>
    [Table("otps")]
    public class Otp
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("id")]
        public long Id { get; set; }

        [Required]
        [Column("email")]
        public string Email { get; set; } = null!;

        [Required]
        [MaxLength(6)]
        [Column("otp_code")]
        public string OtpCode { get; set; } = null!;

        [Required]
        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Required]
        [Column("expires_at")]
        public DateTime ExpiresAt { get; set; }

        [Required]
        [Column("used")]
        public bool Used { get; set; }
    }
}
