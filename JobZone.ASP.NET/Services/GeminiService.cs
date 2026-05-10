using JobZone.ASP.NET.Data;
using JobZone.ASP.NET.DTOs.Response;
using JobZone.ASP.NET.Entities;
using JobZone.ASP.NET.Models;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace JobZone.ASP.NET.Services
{
    public interface IGeminiService
    {
        Task<PaginatedResponse<ResJobWithScoreDTO>> FindJobsWithAIAsync(string? skillsDescription, IFormFile? file, int page, int pageSize);
        Task<ResCvEvaluationDTO> EvaluateCandidateCvAsync(IFormFile? cvFile, string language);
    }

    public class GeminiService : IGeminiService
    {
        private readonly string _apiKey;
        private readonly string _apiUrl;
        private readonly AppDbContext _context;
        private readonly IJobService _jobService;
        private readonly IUserService _userService;
        private readonly HttpClient _httpClient;
        private readonly ILogger<GeminiService> _logger;

        public GeminiService(
            IConfiguration config,
            AppDbContext context,
            IJobService jobService,
            IUserService userService,
            HttpClient httpClient,
            ILogger<GeminiService> logger)
        {
            _apiKey = config["Gemini:ApiKey"] ?? "";
            _apiUrl = config["Gemini:ApiUrl"] ?? "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
            _context = context;
            _jobService = jobService;
            _userService = userService;
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<PaginatedResponse<ResJobWithScoreDTO>> FindJobsWithAIAsync(string? skillsDescription, IFormFile? file, int page, int pageSize)
        {
            _logger.LogInformation(">>> [AI Search] Finding jobs with filters and ranking...");

            // 1. Get recent active jobs (limit to 100 for ranking)
            var jobs = await _context.Jobs
                .Include(j => j.Company)
                .Include(j => j.Skills)
                .Where(j => j.Active)
                .OrderByDescending(j => j.CreatedAt)
                .Take(100)
                .ToListAsync();

            if (!jobs.Any()) return new PaginatedResponse<ResJobWithScoreDTO>();

            // 2. Build Prompt
            var jobsJson = ConvertJobsToJson(jobs);
            var prompt = $@"Act as a STRICT Job Filter. Match jobs to USER QUERY or CV.
USER QUERY: '{skillsDescription}'
AVAILABLE JOBS: {jobsJson}

--- STRICT FILTERING RULES ---
1. SALARY: If user asks for specific salary X, accept ONLY range [X-15%, X+15%]. Outside = REJECT.
2. LOCATION: Exact City match required (e.g. HCM != Hanoi). Different City = REJECT.
3. RELEVANCE: Tech stack/Title must match intent. Irrelevant = REJECT.

--- OUTPUT FORMAT ---
Return a JSON object with a key 'results' which is an array: {{""results"": [{{""jobId"": 123, ""score"": 90}}]}}.
IMPORTANT: If a job is REJECTED or Score < 50, DO NOT include it in the output array. Return {{""results"": []}} if no jobs match.";

            // 3. Call Gemini
            byte[]? fileBytes = null;
            string? mimeType = null;
            if (file != null)
            {
                using var ms = new MemoryStream();
                await file.CopyToAsync(ms);
                fileBytes = ms.ToArray();
                mimeType = file.ContentType;
            }

            var scores = await CallGeminiForListAsync<GeminiJobScore>(prompt, fileBytes, mimeType);

            // 4. Map and Sort
            var scoreMap = scores.ToDictionary(s => s.JobId, s => s.Score);
            var allResults = jobs
                .Where(j => scoreMap.ContainsKey(j.Id))
                .Select(j => new ResJobWithScoreDTO(scoreMap[j.Id], _jobService.ConvertToResFetchJobDTO(j)))
                .OrderByDescending(r => r.Score)
                .ToList();

            // 5. Paginate
            return ManualPaginate(allResults, page, pageSize);
        }

        public async Task<ResCvEvaluationDTO> EvaluateCandidateCvAsync(IFormFile? cvFile, string language)
        {
            _logger.LogInformation(">>> [AI CV Evaluation] Analyzing CV...");

            // 1. Get current user's online resume if file is missing
            string? cvText = null;
            byte[]? fileBytes = null;
            string? mimeType = null;

            if (cvFile != null)
            {
                using var ms = new MemoryStream();
                await cvFile.CopyToAsync(ms);
                fileBytes = ms.ToArray();
                mimeType = cvFile.ContentType;
            }
            else
            {
                // Fallback to online resume of current user (this requires current user ID)
                // For simplicity in this DTO version, we'll focus on the file upload first.
                cvText = "Please analyze the attached CV or candidate details provided.";
            }

            // 2. Get some recent jobs for context
            var recentJobs = await _context.Jobs
                .Include(j => j.Company)
                .Include(j => j.Skills)
                .Where(j => j.Active)
                .OrderByDescending(j => j.CreatedAt)
                .Take(30)
                .ToListAsync();

            var jobsJson = ConvertJobsToJson(recentJobs);
            var prompt = BuildCvEvaluationPrompt(cvText ?? "Analyze the candidate", jobsJson, language);

            // 3. Call Gemini
            return await CallGeminiAsync<ResCvEvaluationDTO>(prompt, fileBytes, mimeType) ?? new ResCvEvaluationDTO();
        }

        private async Task<T?> CallGeminiAsync<T>(string prompt, byte[]? fileBytes = null, string? mimeType = null)
        {
            try
            {
                var contents = new List<object>();
                var parts = new List<object> { new { text = prompt } };

                if (fileBytes != null && mimeType != null)
                {
                    parts.Add(new
                    {
                        inline_data = new
                        {
                            mime_type = mimeType,
                            data = Convert.ToBase64String(fileBytes)
                        }
                    });
                }

                contents.Add(new { parts });

                var requestBody = new
                {
                    contents,
                    generationConfig = new
                    {
                        temperature = 0.2,
                        topP = 0.95,
                        maxOutputTokens = 8000,
                        responseMimeType = "application/json"
                    }
                };

                var response = await _httpClient.PostAsync($"{_apiUrl}?key={_apiKey}",
                    new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json"));

                if (!response.IsSuccessStatusCode)
                {
                    var error = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Gemini API Error: {Error}", error);
                    return default;
                }

                var jsonResponse = await response.Content.ReadAsStringAsync();
                var doc = JsonDocument.Parse(jsonResponse);
                var text = doc.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString();

                if (string.IsNullOrEmpty(text)) return default;

                return JsonSerializer.Deserialize<T>(text, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling Gemini API");
                return default;
            }
        }

        private async Task<List<T>> CallGeminiForListAsync<T>(string prompt, byte[]? fileBytes = null, string? mimeType = null)
        {
            var result = await CallGeminiAsync<GeminiListResponse<T>>(prompt, fileBytes, mimeType);
            return result?.Results ?? new List<T>();
        }

        private string ConvertJobsToJson(List<Job> jobs)
        {
            var simplified = jobs.Select(job => new
            {
                id = job.Id,
                title = job.Name,
                skills = job.Skills.Select(s => s.Name).ToList(),
                desc = job.Description != null ? (job.Description.Length > 500 ? job.Description.Substring(0, 500) + "..." : job.Description) : "",
                loc = job.Location,
                salary = job.Salary.ToString("F0"),
                lvl = job.Level.ToString(),
                comp = job.Company?.Name,
                field = job.Company?.Field,
                scale = job.Company?.Scale
            });

            return JsonSerializer.Serialize(simplified);
        }

        private PaginatedResponse<T> ManualPaginate<T>(List<T> allResults, int page, int pageSize)
        {
            int start = (page - 1) * pageSize;
            var pageContent = allResults.Skip(start).Take(pageSize).ToList();

            return new PaginatedResponse<T>
            {
                Meta = new PaginationMeta
                {
                    Page = page,
                    PageSize = pageSize,
                    Total = allResults.Count,
                    Pages = (int)Math.Ceiling((double)allResults.Count / pageSize)
                },
                Result = pageContent
            };
        }

        private string BuildCvEvaluationPrompt(string cvText, string jobsJson, string language)
        {
            string languageInstruction = language.Equals("en", StringComparison.OrdinalIgnoreCase)
                ? "You must provide the entire response in English. All keys and values in the JSON must be in English."
                : "Bạn phải cung cấp toàn bộ phản hồi bằng Tiếng Việt. Mọi khóa và giá trị trong JSON phải là Tiếng Việt.";

            return $@"You are an expert HR and career advisor. {languageInstruction}
Analyze the attached CV/Details. Provide evaluation in a single JSON object.
JSON STRUCTURE: {{""overallScore"": number, ""summary"": string, ""strengths"": string[], ""improvements"": [{{""area"": string, ""suggestion"": string}}], ""estimatedSalaryRange"": string, ""suggestedRoadmap"": [{{""step"": number, ""action"": string, ""reason"": string}}], ""relevantJobs"": [{{""jobId"": number, ""jobTitle"": string, ""companyName"": string, ""matchReason"": string}}]}}.

CANDIDATE DETAILS: {cvText}
AVAILABLE JOBS: {jobsJson}";
        }

        private class GeminiJobScore { public long JobId { get; set; } public int Score { get; set; } }
        private class GeminiListResponse<T> { [JsonPropertyName("results")] public List<T>? Results { get; set; } }
    }
}
