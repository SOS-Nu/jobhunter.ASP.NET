using System.Text.Json.Serialization;

namespace johunter.ASP.NET.Models
{
    public class RestResponse<T>
    {
        public int StatusCode { get; set; } = 200;
        
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Error { get; set; }
        
        public string? Message { get; set; }
        
        public T? Data { get; set; }
    }

    public class PaginationMeta
    {
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int Pages { get; set; }
        public int Total { get; set; }
    }

    public class PaginatedResponse<T>
    {
        public PaginationMeta Meta { get; set; } = new PaginationMeta();
        public IEnumerable<T> Result { get; set; } = new List<T>();
    }
}
