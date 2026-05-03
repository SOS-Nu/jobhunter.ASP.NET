using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace JobZone.ASP.NET.Hubs
{
    public class EmailUserIdProvider : IUserIdProvider
    {
        public string? GetUserId(HubConnectionContext connection)
        {
            return connection.User?.Identity?.Name;
        }
    }
}
