using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace jobhunter.ASP.NET.Hubs
{
    public class EmailUserIdProvider : IUserIdProvider
    {
        public string? GetUserId(HubConnectionContext connection)
        {
            return connection.User?.Identity?.Name;
        }
    }
}
