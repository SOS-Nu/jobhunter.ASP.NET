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
        Task<PaginatedResponse<ResCandidateWithScoreDTO>> FindCandidatesWithAIAsync(string? jobDescription, IFormFile? file, int page, int pageSize);
        Task<ResCvEvaluationDTO> EvaluateCandidateCvAsync(IFormFile? cvFile, string language);
        Task<int> ScoreCvAsync(Job job, string cvFileName);
    }

    public class GeminiService : IGeminiService
    {
        private readonly string _apiKey;
        private readonly string _apiUrl;
        private readonly AppDbContext _context;
        private readonly IJobService _jobService;
        private readonly IUserService _userService;
        private readonly ICurrentUserService _currentUserService;
        private readonly IFileService _fileService;
        private readonly HttpClient _httpClient;
        private readonly ILogger<GeminiService> _logger;

        private static readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            NumberHandling = JsonNumberHandling.AllowReadingFromString | JsonNumberHandling.WriteAsString,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        public GeminiService(
            IConfiguration config,
            AppDbContext context,
            IJobService jobService,
            IUserService userService,
            ICurrentUserService currentUserService,
            IFileService fileService,
            HttpClient httpClient,
            ILogger<GeminiService> logger)
        {
            _apiKey = config["Gemini:ApiKey"] ?? "";
            // Use v1beta for advanced features like responseMimeType
            _apiUrl = config["Gemini:ApiUrl"] ?? "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";
            _context = context;
            _jobService = jobService;
            _userService = userService;
            _currentUserService = currentUserService;
            _fileService = fileService;
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<PaginatedResponse<ResJobWithScoreDTO>> FindJobsWithAIAsync(string? skillsDescription, IFormFile? file, int page, int pageSize)
        {
            _logger.LogInformation(">>> [AI Search] Finding jobs with ranking...");

            var jobs = await _context.Jobs
                .Include(j => j.Company)
                .Include(j => j.Skills)
                .Where(j => j.Active)
                .OrderByDescending(j => j.CreatedAt)
                .Take(50)
                .ToListAsync();

            if (!jobs.Any()) return new PaginatedResponse<ResJobWithScoreDTO>();

            string cvText = "";
            if (file != null && file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
            {
                cvText = _fileService.ExtractTextFromPdf(file);
            }

            var jobsJson = ConvertJobsToJson(jobs);
            var prompt = $@"Act as a Senior Recruiter. Match jobs to the provided query or CV.
STRICT RULE: Return ONLY a valid JSON object with key 'results'.
QUERY: {skillsDescription}
CV CONTENT: {cvText}
JOBS DATA: {jobsJson}

OUTPUT FORMAT:
{{
  ""results"": [
    {{ ""jobId"": 1, ""score"": 90 }}
  ]
}}";

            var scores = await CallGeminiForListAsync<GeminiJobScore>(prompt);
            var scoreMap = scores.ToDictionary(s => s.JobId, s => s.Score);
            
            var allResults = jobs
                .Where(j => scoreMap.ContainsKey(j.Id))
                .Select(j => new ResJobWithScoreDTO(scoreMap[j.Id], _jobService.ConvertToResFetchJobDTO(j)))
                .OrderByDescending(r => r.Score)
                .ToList();

            return ManualPaginate(allResults, page, pageSize);
        }

        public async Task<PaginatedResponse<ResCandidateWithScoreDTO>> FindCandidatesWithAIAsync(string? jobDescription, IFormFile? file, int page, int pageSize)
        {
            _logger.LogInformation(">>> [AI Candidate Search] Finding candidates with ranking...");

            var users = await _context.Users
                .Include(u => u.Role)
                .Include(u => u.OnlineResume).ThenInclude(r => r!.Skills)
                .Include(u => u.WorkExperiences)
                .Where(u => u.IsPublic == true && u.Role.Name == "NORMAL_USER" && u.OnlineResume != null)
                .OrderByDescending(u => u.CreatedAt)
                .Take(50)
                .ToListAsync();

            if (!users.Any()) return new PaginatedResponse<ResCandidateWithScoreDTO>();

            string finalJobDescription = jobDescription ?? "";
            if (file != null && file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
            {
                finalJobDescription = _fileService.ExtractTextFromPdf(file);
            }

            var candidatesJson = await ConvertUsersToJsonAsync(users);
            var prompt = $@"Act as a Senior HR Headhunter. Match candidates to the provided Job Description.
STRICT RULE: Return ONLY a valid JSON object with key 'results'.
JOB DESCRIPTION: {finalJobDescription}
CANDIDATES DATA: {candidatesJson}

OUTPUT FORMAT:
{{
  ""results"": [
    {{ ""userId"": 1, ""score"": 90 }}
  ]
}}";

            var scores = await CallGeminiForListAsync<GeminiCandidateScore>(prompt);
            var scoreMap = scores.ToDictionary(s => s.UserId, s => s.Score);

            var allResults = users
                .Where(u => scoreMap.ContainsKey(u.Id))
                .Select(u => new ResCandidateWithScoreDTO(scoreMap[u.Id], _userService.ConvertToResUserDetailDTO(u)))
                .OrderByDescending(r => r.Score)
                .ToList();

            return ManualPaginate(allResults, page, pageSize);
        }

        public async Task<ResCvEvaluationDTO> EvaluateCandidateCvAsync(IFormFile? cvFile, string language)
        {
            _logger.LogInformation(">>> [AI CV Evaluation] Processing...");

            string cvText = "";
            if (cvFile != null && cvFile.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
            {
                cvText = _fileService.ExtractTextFromPdf(cvFile);
            }

            if (string.IsNullOrEmpty(cvText))
            {
                var email = _currentUserService.GetCurrentUserEmail();
                if (!string.IsNullOrEmpty(email))
                {
                    var user = await _context.Users
                        .Include(u => u.OnlineResume).ThenInclude(r => r!.Skills)
                        .Include(u => u.WorkExperiences)
                        .FirstOrDefaultAsync(u => u.Email == email);
                    
                    if (user != null)
                    {
                        if (!string.IsNullOrEmpty(user.MainResume))
                        {
                            cvText = _fileService.ExtractTextFromPdf(user.MainResume, "resumes");
                        }
                        if (string.IsNullOrEmpty(cvText))
                        {
                            cvText = BuildTextFromOnlineResume(user);
                        }
                    }
                }
            }

            if (string.IsNullOrEmpty(cvText)) cvText = "No CV data available.";
            
            var recentJobs = await _context.Jobs.Include(j => j.Company).Include(j => j.Skills)
                .Where(j => j.Active).OrderByDescending(j => j.CreatedAt).Take(30).ToListAsync();

            var prompt = BuildCvEvaluationPrompt(cvText, ConvertJobsToJson(recentJobs), language);
            var result = await CallGeminiAsync<ResCvEvaluationDTO>(prompt);
            
            return result ?? new ResCvEvaluationDTO { Summary = "AI failed to respond properly. Check logs." };
        }

        public async Task<int> ScoreCvAsync(Job job, string cvFileName)
        {
            try
            {
                _logger.LogInformation(">>> [AI Scoring] Scoring CV {FileName} against Job {JobId}", cvFileName, job.Id);
                
                string cvText = _fileService.ExtractTextFromPdf(cvFileName, "resume");
                if (string.IsNullOrEmpty(cvText))
                {
                    _logger.LogWarning(">>> [AI Scoring] CV Text is empty in 'resume' folder. Trying root folder...");
                    cvText = _fileService.ExtractTextFromPdf(cvFileName, ""); 
                }

                if (string.IsNullOrEmpty(cvText)) return 0;

                var prompt = $@"As an expert HR, evaluate this resume against the job description.
Return ONLY a JSON object: {{""score"": number (0-100)}}.

Job Details:
Title: {job.Name}
Description: {job.Description}
Level: {job.Level}

Resume Text:
{cvText}";

                var result = await CallGeminiAsync<GeminiScoreResponse>(prompt);
                return result?.Score ?? 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error scoring CV with AI");
                return 0;
            }
        }

        private class GeminiScoreResponse { public int Score { get; set; } }

        private async Task<T?> CallGeminiAsync<T>(string prompt)
        {
            try
            {
                var requestBody = new
                {
                    contents = new[] { new { parts = new[] { new { text = prompt } } } },
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
                    _logger.LogError("Gemini API Error: {Status} - {Error}", response.StatusCode, error);
                    return default;
                }

                var json = await response.Content.ReadAsStringAsync();
                var doc = JsonDocument.Parse(json);
                
                if (!doc.RootElement.TryGetProperty("candidates", out var candidates) || candidates.GetArrayLength() == 0)
                {
                    _logger.LogWarning("Gemini returned no candidates.");
                    return default;
                }

                var text = candidates[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString();

                if (string.IsNullOrEmpty(text)) return default;
                
                string cleaned = CleanJson(text);
                try 
                {
                    return JsonSerializer.Deserialize<T>(cleaned, _jsonOptions);
                }
                catch (JsonException ex)
                {
                    _logger.LogError(ex, "Failed to deserialize Gemini response: {RawText}", text);
                    return default;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception in CallGeminiAsync");
                return default;
            }
        }

        private string CleanJson(string raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) return "{}";
            var cleaned = raw.Trim();
            if (cleaned.StartsWith("```json")) cleaned = cleaned.Substring(7);
            else if (cleaned.StartsWith("```")) cleaned = cleaned.Substring(3);
            if (cleaned.EndsWith("```")) cleaned = cleaned.Substring(0, cleaned.Length - 3);
            return cleaned.Trim();
        }

        private async Task<List<T>> CallGeminiForListAsync<T>(string prompt)
        {
            var result = await CallGeminiAsync<GeminiListResponse<T>>(prompt);
            return result?.Results ?? new List<T>();
        }

        private string ConvertJobsToJson(List<Job> jobs)
        {
            var list = jobs.Select(j => new {
                id = j.Id, 
                title = j.Name, 
                skills = j.Skills.Select(s => s.Name),
                loc = j.Location, 
                salary = j.Salary.ToString("F0"), 
                comp = j.Company?.Name
            }).ToList();
            return JsonSerializer.Serialize(list);
        }

        private async Task<string> ConvertUsersToJsonAsync(List<User> users)
        {
            var list = new List<object>();
            foreach (var u in users)
            {
                // 1. Get structured text from Online Resume (including Skill Names)
                string onlineResumeText = BuildTextFromOnlineResume(u);

                // 2. Extract text from uploaded CV file (MainResume) if available
                string fileResumeText = "";
                if (!string.IsNullOrEmpty(u.MainResume))
                {
                    try
                    {
                        // Prioritize "resumes" folder as per Java logic
                        fileResumeText = _fileService.ExtractTextFromPdf(u.MainResume, "resumes");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning("Could not extract text from file {File} for user {UserId}: {Message}", 
                            u.MainResume, u.Id, ex.Message);
                    }
                }

                list.Add(new {
                    id = u.Id,
                    name = u.Name,
                    // Combine both sources for maximum context
                    resumeContent = (onlineResumeText + "\n" + fileResumeText).Trim()
                });
            }
            return JsonSerializer.Serialize(list);
        }

        private PaginatedResponse<T> ManualPaginate<T>(List<T> all, int page, int size)
        {
            return new PaginatedResponse<T> {
                Result = all.Skip((page - 1) * size).Take(size).ToList(),
                Meta = new PaginationMeta { 
                    Page = page, 
                    PageSize = size, 
                    Total = all.Count, 
                    Pages = (int)Math.Ceiling((double)all.Count / size) 
                }
            };
        }

        private string BuildTextFromOnlineResume(User u)
        {
            if (u.OnlineResume == null) return "";
            var sb = new StringBuilder();
            sb.AppendLine($"Title: {u.OnlineResume.Title}");
            sb.AppendLine($"Name: {u.OnlineResume.FullName}");
            sb.AppendLine($"Summary: {u.OnlineResume.Summary}");
            if (u.OnlineResume.Skills != null) sb.AppendLine("Skills: " + string.Join(", ", u.OnlineResume.Skills.Select(s => s.Name)));
            if (u.WorkExperiences != null) 
            {
                sb.AppendLine("Work Experiences:");
                foreach (var ex in u.WorkExperiences) sb.AppendLine($"- {ex.CompanyName}: {ex.Description}");
            }
            return sb.ToString();
        }

        private string BuildCvEvaluationPrompt(string cv, string jobs, string lang)
        {
            string instr = lang == "en" ? "Response ALL string values in English." : "Phản hồi toàn bộ giá trị string bằng Tiếng Việt.";
            return $@"You are an expert HR. {instr}
Analyze the candidate's CV against market standards and available jobs.
Return ONLY a valid JSON object matching the requested structure.

STRUCTURE:
{{
  ""overallScore"": 0,
  ""summary"": ""..."",
  ""strengths"": [""...""],
  ""improvements"": [{{ ""area"": ""..."", ""suggestion"": ""..."" }}],
  ""estimatedSalaryRange"": ""..."",
  ""suggestedRoadmap"": [{{ ""step"": 1, ""action"": ""..."", ""reason"": ""..."" }}],
  ""relevantJobs"": [{{ ""jobId"": 1, ""jobTitle"": ""..."", ""companyName"": ""..."", ""matchReason"": ""..."" }}]
}}

CV DATA: {cv}
JOBS DATA: {jobs}";
        }

        private class GeminiJobScore { public long JobId { get; set; } public int Score { get; set; } }
        private class GeminiCandidateScore { public long UserId { get; set; } public int Score { get; set; } }
        private class GeminiListResponse<T> { [JsonPropertyName("results")] public List<T>? Results { get; set; } }
    }
}
