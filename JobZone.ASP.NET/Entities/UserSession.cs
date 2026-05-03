using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace JobZone.ASP.NET.Entities
{
    /// <summary>
    /// Maps from: vn.hoidanit.JobZone.domain.entity.UserSession
    /// Table: user_sessions
    /// </summary>
    [Table("user_sessions")]
    public class UserSession
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("id")]
        public long Id { get; set; }

        [Required]
        [Column("refresh_token_jti")]
        public string RefreshTokenJti { get; set; } = null!;

        [Column("ip_address")]
        public string? IpAddress { get; set; }

        [Column("user_agent", TypeName = "TEXT")]
        public string? UserAgent { get; set; }

        [Required]
        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Required]
        [Column("last_used_at")]
        public DateTime LastUsedAt { get; set; }

        [Required]
        [Column("expires_at")]
        public DateTime ExpiresAt { get; set; }

        // Navigation: Many-to-One with User
        [Column("user_id")]
        public long UserId { get; set; }
        public virtual User User { get; set; } = null!;
    }
}
