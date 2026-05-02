using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace jobhunter.ASP.NET.Entities
{
    /// <summary>
    /// Maps from: vn.hoidanit.jobhunter.domain.entity.ChatRoom (extends BaseEntity)
    /// Table: chat_rooms
    /// </summary>
    [Table("chat_rooms")]
    public class ChatRoom
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("id")]
        public long Id { get; set; }

        [Required]
        [Column("chat_name")]
        public string ChatName { get; set; } = null!;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        [Column("created_by")]
        public string? CreatedBy { get; set; }

        [Column("updated_by")]
        public string? UpdatedBy { get; set; }

        // Navigation: Many-to-One with User (sender)
        [Column("sender_id")]
        public long SenderId { get; set; }
        public virtual User Sender { get; set; } = null!;

        // Navigation: Many-to-One with User (receiver)
        [Column("receiver_id")]
        public long ReceiverId { get; set; }
        public virtual User Receiver { get; set; } = null!;
    }
}
