using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using jobhunter.ASP.NET.Models;

namespace jobhunter.ASP.NET.Filters
{
    /// <summary>
    /// Replaces the suppressed default ApiValidation filter.
    /// Only triggers for FluentValidation errors (Data Annotations are suppressed).
    /// Returns errors in the same RestResponse format used by Java's GlobalException handler.
    /// 
    /// Why we need this:
    /// We suppressed SuppressModelStateInvalidFilter to stop [Required] on EF entities
    /// from validating nested navigation properties (e.g., Job.Skills[0].Name).
    /// But we still need FluentValidation errors to return 400 with proper error messages.
    /// </summary>
    public class ValidateModelFilter : IActionFilter
    {
        public void OnActionExecuting(ActionExecutingContext context)
        {
            if (!context.ModelState.IsValid)
            {
                var errors = context.ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .SelectMany(x => x.Value!.Errors.Select(e => new
                    {
                        Field = x.Key,
                        Message = e.ErrorMessage
                    }))
                    .ToList();

                // Match Java's MethodArgumentNotValidException response format:
                // { statusCode: 400, error: "...", message: "firstErrorMessage" }
                var firstError = errors.FirstOrDefault()?.Message ?? "Validation failed";

                var response = new RestResponse<object>
                {
                    StatusCode = 400,
                    Error = "Validation Error",
                    Message = firstError
                };

                context.Result = new BadRequestObjectResult(response);
            }
        }

        public void OnActionExecuted(ActionExecutedContext context) { }
    }
}
