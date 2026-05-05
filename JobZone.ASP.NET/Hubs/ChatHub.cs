using Microsoft.AspNetCore.SignalR;
using JobZone.ASP.NET.Entities;
using JobZone.ASP.NET.Services;
using JobZone.ASP.NET.DTOs.Request;
using Microsoft.AspNetCore.Authorization;

namespace JobZone.ASP.NET.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly IUserService _userService;
        private readonly IChatService _chatService;

        public ChatHub(IUserService userService, IChatService chatService)
        {
            _userService = userService;
            _chatService = chatService;
        }

        public async Task AddUser(User user)
        {
            await _userService.UpdateStatusAsync(user);
            await Clients.All.SendAsync("UserConnected", user);
        }

        public async Task DisconnectUser(User user)
        {
            await _userService.DisconnectAsync(user);
            await Clients.All.SendAsync("UserDisconnected", user);
        }

        public async Task SendMessage(ChatMessage chatMessage)
        {
            var sender = await _userService.GetUserByIdAsync(chatMessage.Sender.Id);
            chatMessage.Sender = sender;
            chatMessage.SenderId = sender.Id;

            var receiver = await _userService.GetUserByIdAsync(chatMessage.Receiver.Id);
            chatMessage.Receiver = receiver;
            chatMessage.ReceiverId = receiver.Id;

            var savedMsg = await _chatService.SaveMessageAsync(chatMessage);

            var chatNotification = new ChatNotificationDTO
            {
                Id = savedMsg.Id,
                Content = savedMsg.Content,
                ReceiverId = savedMsg.Receiver.Id,
                SenderId = savedMsg.Sender.Id,
                TimeStamp = savedMsg.TimeStamp ?? DateTime.UtcNow
            };

            await Clients.User(receiver.Email).SendAsync("ReceiveMessage", chatNotification);
        }
    }
}
