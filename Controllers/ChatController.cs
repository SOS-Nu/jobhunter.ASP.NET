using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using jobhunter.ASP.NET.DTOs.Response;
using jobhunter.ASP.NET.Entities;
using jobhunter.ASP.NET.Middleware;
using jobhunter.ASP.NET.Services;

namespace jobhunter.ASP.NET.Controllers
{
    [Route("api/v1")]
    [ApiController]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IChatService _chatService;

        public ChatController(IUserService userService, IChatService chatService)
        {
            _userService = userService;
            _chatService = chatService;
        }

        [HttpGet("users-connected")]
        public async Task<IActionResult> FindConnectedUsers([FromQuery] long id)
        {
            var users = await _userService.FindConnectedUsersAsync(id);
            if (users == null)
            {
                return Ok(new List<ResUserDTO>());
            }
            return Ok(users);
        }

        [HttpGet("messages/{senderId}/{recipientId}")]
        public async Task<IActionResult> FindChatMessages(long senderId, long recipientId)
        {
            var chatList = await _chatService.FindChatMessagesAsync(senderId, recipientId);
            return Ok(chatList);
        }

        // NOTE: WebSocket endpoints (/user.addUser, /user.disconnectUser, /chat) 
        // will be implemented using SignalR Hubs instead of STOMP MessageMapping.
    }
}
