using Microsoft.EntityFrameworkCore;
using JobZone.ASP.NET.Data;
using JobZone.ASP.NET.DTOs.Response;
using JobZone.ASP.NET.Entities;
using System.Linq;

namespace JobZone.ASP.NET.Services
{
    public interface IChatService
    {
        string GetChatRoomName(long senderId, long recipientId, bool createNewRoomIfNotExists);
        string CreateChatName(long senderId, long recipientId);
        Task<ChatMessage> SaveMessageAsync(ChatMessage chatMessage);
        Task<List<ResChatMessageDTO>> FindChatMessagesAsync(long senderId, long recipientId);
    }

    public class ChatService : IChatService
    {
        private readonly AppDbContext _context;

        public ChatService(AppDbContext context)
        {
            _context = context;
        }

        public string GetChatRoomName(long senderId, long recipientId, bool createNewRoomIfNotExists)
        {
            var currentChatRoomSR = _context.ChatRooms.FirstOrDefault(cr => cr.SenderId == senderId && cr.ReceiverId == recipientId);
            var currentChatRoomRS = _context.ChatRooms.FirstOrDefault(cr => cr.SenderId == recipientId && cr.ReceiverId == senderId);

            if (currentChatRoomSR != null && !string.IsNullOrEmpty(currentChatRoomSR.ChatName))
            {
                return currentChatRoomSR.ChatName;
            }
            else if (currentChatRoomRS != null && !string.IsNullOrEmpty(currentChatRoomRS.ChatName))
            {
                return currentChatRoomRS.ChatName;
            }
            else
            {
                if (createNewRoomIfNotExists)
                {
                    return CreateChatName(senderId, recipientId);
                }
                return string.Empty;
            }
        }

        public string CreateChatName(long senderId, long recipientId)
        {
            var chatName = $"{senderId}_{recipientId}";

            var senderRecipientRoom = new ChatRoom
            {
                ChatName = chatName,
                SenderId = senderId,
                ReceiverId = recipientId
            };

            var recipientSenderRoom = new ChatRoom
            {
                ChatName = chatName,
                SenderId = recipientId,
                ReceiverId = senderId
            };

            _context.ChatRooms.Add(senderRecipientRoom);
            _context.ChatRooms.Add(recipientSenderRoom);
            _context.SaveChanges();

            return chatName;
        }

        public async Task<ChatMessage> SaveMessageAsync(ChatMessage chatMessage)
        {
            var chatRoom = GetChatRoomName(chatMessage.SenderId, chatMessage.ReceiverId, true);
            chatMessage.RoomName = chatRoom;
            
            _context.ChatMessages.Add(chatMessage);
            await _context.SaveChangesAsync();
            return chatMessage;
        }

        public async Task<List<ResChatMessageDTO>> FindChatMessagesAsync(long senderId, long recipientId)
        {
            var roomName1 = $"{senderId}_{recipientId}";
            var roomName2 = $"{recipientId}_{senderId}";

            var messages = await _context.ChatMessages
                .Include(m => m.Sender)
                .Include(m => m.Receiver)
                .Where(m => m.RoomName == roomName1 || m.RoomName == roomName2)
                .OrderBy(m => m.TimeStamp)
                .ToListAsync();

            return messages.Select(m => new ResChatMessageDTO
            {
                Id = m.Id,
                Content = m.Content,
                TimeStamp = m.TimeStamp ?? m.CreatedAt,
                Sender = m.Sender != null ? new UserInChatDTO
                {
                    Id = m.Sender.Id,
                    Name = m.Sender.Name,
                    Email = m.Sender.Email,
                    Status = m.Sender.Status
                } : null,
                Receiver = m.Receiver != null ? new UserInChatDTO
                {
                    Id = m.Receiver.Id,
                    Name = m.Receiver.Name,
                    Email = m.Receiver.Email,
                    Status = m.Receiver.Status
                } : null
            }).ToList();
        }
    }
}
