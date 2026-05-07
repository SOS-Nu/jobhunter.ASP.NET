using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace JobZone.ASP.NET.Entities
{
    [Table("user_save_jobs")]
    public class UserSaveJob
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("id")]
        public long Id { get; set; }

        [Column("user_id")]
        public long UserId { get; set; }
        public virtual User User { get; set; } = null!;

        [Column("job_id")]
        public long JobId { get; set; }
        public virtual Job Job { get; set; } = null!;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
