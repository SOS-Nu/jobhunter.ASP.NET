using System.Net;
using System.Text.Json;
using JobZone.ASP.NET.Models;

namespace JobZone.ASP.NET.Middleware
{
    /// <summary>
    /// Global Exception Middleware.
    /// Maps from: vn.hoidanit.JobZone.util.error.GlobalException (@RestControllerAdvice)
    /// agents.md rule 8: Use a global Exception Middleware, return proper HTTP status codes,
    /// response MUST match RestResponse format.
    /// </summary>
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;

        public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception occurred");
                await HandleExceptionAsync(context, ex);
            }
        }

        private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json; charset=utf-8";

            var response = new RestResponse<object>();

            switch (exception)
            {
                // Maps from: @ExceptionHandler(IdInvalidException.class)
                case IdInvalidException:
                    context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                    response.StatusCode = (int)HttpStatusCode.BadRequest;
                    response.Error = "Exception occurs...";
                    response.Message = exception.Message;
                    break;

                // Maps from: @ExceptionHandler(PermissionException.class)
                case PermissionException:
                    context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                    response.StatusCode = (int)HttpStatusCode.Forbidden;
                    response.Error = "Forbidden";
                    response.Message = exception.Message;
                    break;

                // Maps from: @ExceptionHandler(StorageException.class)
                case StorageException:
                    context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                    response.StatusCode = (int)HttpStatusCode.BadRequest;
                    response.Error = "Exception upload file...";
                    response.Message = exception.Message;
                    break;

                // Maps from: @ExceptionHandler(BadCredentialsException, UsernameNotFoundException)
                case UnauthorizedAccessException:
                    context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                    response.StatusCode = (int)HttpStatusCode.Unauthorized;
                    response.Error = "Unauthorized";
                    response.Message = exception.Message;
                    break;

                // Maps from: @ExceptionHandler(SessionLimitExceededException.class)
                case SessionLimitExceededException:
                    context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
                    response.StatusCode = (int)HttpStatusCode.TooManyRequests;
                    response.Error = "Session Limit Exceeded";
                    response.Message = exception.Message;
                    break;

                // Maps from: @ExceptionHandler(Exception.class) - catch all
                default:
                    context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                    response.StatusCode = (int)HttpStatusCode.InternalServerError;
                    response.Error = "Internal Server Error";
                    response.Message = exception.Message;
                    break;
            }

            var jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
                DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
            };
            var json = JsonSerializer.Serialize(response, jsonOptions);
            await context.Response.WriteAsync(json);
        }
    }

    // ========================
    // Custom Exception Types
    // Maps from: vn.hoidanit.JobZone.util.error.*
    // ========================

    /// <summary>
    /// Maps from: IdInvalidException
    /// </summary>
    public class IdInvalidException : Exception
    {
        public IdInvalidException(string message) : base(message) { }
    }

    /// <summary>
    /// Maps from: PermissionException
    /// </summary>
    public class PermissionException : Exception
    {
        public PermissionException(string message) : base(message) { }
    }

    /// <summary>
    /// Maps from: StorageException
    /// </summary>
    public class StorageException : Exception
    {
        public StorageException(string message) : base(message) { }
    }

    /// <summary>
    /// Maps from: SessionLimitExceededException
    /// </summary>
    public class SessionLimitExceededException : Exception
    {
        public SessionLimitExceededException(string message) : base(message) { }
    }
}
