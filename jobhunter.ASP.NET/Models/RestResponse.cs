using System.Text.Json.Serialization;

namespace jobhunter.ASP.NET.Models
{
    /// <summary>
    /// Standard API Response wrapper. All API responses MUST follow this structure.
    /// Maps from: vn.hoidanit.jobhunter.domain.response.RestResponse<T>
    /// </summary>
    public class RestResponse<T>
    {
        public int StatusCode { get; set; }

        //[JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Error { get; set; }

        /// <summary>
        /// message có thể là string, hoặc list (matching Spring Boot logic)
        /// </summary>
        public object? Message { get; set; }

        public T? Data { get; set; }
    }

    /// <summary>
    /// Pagination metadata. Maps from: ResultPaginationDTO
    /// </summary>
    public class PaginationMeta
    {
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int Pages { get; set; }
        public long Total { get; set; }
    }

    /// <summary>
    /// Paginated response with meta + result. Used inside RestResponse.Data.
    /// </summary>
    public class PaginatedResponse<T>
    {
        public PaginationMeta Meta { get; set; } = new PaginationMeta();
        public IEnumerable<T> Result { get; set; } = new List<T>();
    }
}
