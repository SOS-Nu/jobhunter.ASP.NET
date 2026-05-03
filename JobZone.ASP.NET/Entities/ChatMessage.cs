using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace JobZone.ASP.NET.Entities
{
    /// <summary>
    /// Maps from: vn.hoidanit.JobZone.domain.entity.ChatMessage (extends BaseEntity)
    /// Table: chat_messages
    /// </summary>
    [Table("chat_messages")]
    public class ChatMessage
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("id")]
        public long Id { get; set; }

        [Required]
        [Column("room_name")]
        public string RoomName { get; set; } = null!;

        [Column("content")]
        public string? Content { get; set; }

        [Column("time_stamp")]
        public DateTime? TimeStamp { get; set; }

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
