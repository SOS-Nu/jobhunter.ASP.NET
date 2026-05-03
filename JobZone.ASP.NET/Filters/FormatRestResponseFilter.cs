using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using JobZone.ASP.NET.Models;

namespace JobZone.ASP.NET.Filters
{
    /// <summary>
    /// Global ResultFilter to wrap all responses into RestResponse&lt;T&gt;.
    /// Maps from: vn.hoidanit.JobZone.util.FormatRestResponse (ResponseBodyAdvice)
    /// 
    /// agents.md rule 2: Use a global ResultFilter to wrap all responses into RestResponse&lt;T&gt;.
    /// DO NOT wrap: File responses, Streaming responses.
    /// </summary>
    public class FormatRestResponseFilter : IResultFilter
    {
        public void OnResultExecuting(ResultExecutingContext context)
        {
            // Skip wrapping for non-ObjectResult (file downloads, streaming, etc.)
            if (context.Result is not ObjectResult objectResult)
                return;

            // Skip if response is already a RestResponse
            if (objectResult.Value is RestResponse<object>)
                return;

            // Skip swagger/api-docs paths (matching Spring Boot logic)
            var path = context.HttpContext.Request.Path.Value ?? "";
            if (path.StartsWith("/swagger") || path.StartsWith("/v3/api-docs"))
                return;

            // Skip error responses (status >= 400) - they are handled by GlobalExceptionMiddleware
            var statusCode = objectResult.StatusCode ?? context.HttpContext.Response.StatusCode;
            if (statusCode >= 400)
                return;

            // Wrap the response in RestResponse<object>
            var response = new RestResponse<object>
            {
                StatusCode = statusCode,
                Data = objectResult.Value,
                Message = GetApiMessage(context) ?? "CALL API SUCCESS"
            };

            objectResult.Value = response;
            objectResult.StatusCode = statusCode;
        }

        public void OnResultExecuted(ResultExecutedContext context)
        {
            // No-op
        }

        /// <summary>
        /// Gets custom API message from ApiMessageAttribute on the action method.
        /// Maps from: @ApiMessage annotation in Spring Boot.
        /// </summary>
        private static string? GetApiMessage(ResultExecutingContext context)
        {
            var endpoint = context.HttpContext.GetEndpoint();
            var attribute = endpoint?.Metadata.GetMetadata<ApiMessageAttribute>();
            return attribute?.Message;
        }
    }

    /// <summary>
    /// Custom attribute to specify API response message.
    /// Maps from: vn.hoidanit.JobZone.util.annotation.ApiMessage
    /// </summary>
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
    public class ApiMessageAttribute : Attribute
    {
        public string Message { get; }

        public ApiMessageAttribute(string message)
        {
            Message = message;
        }
    }
}
