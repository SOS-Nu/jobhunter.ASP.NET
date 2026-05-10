using System.Collections.Generic;

namespace JobZone.ASP.NET.DTOs.Response
{
    public class ResCvEvaluationDTO
    {
        public int OverallScore { get; set; }
        public string? Summary { get; set; }
        public List<string>? Strengths { get; set; }
        public List<CvImprovementDTO>? Improvements { get; set; }
        public string? EstimatedSalaryRange { get; set; }
        public List<CvRoadmapStepDTO>? SuggestedRoadmap { get; set; }
        public List<CvRelevantJobDTO>? RelevantJobs { get; set; }
    }

    public class CvImprovementDTO
    {
        public string? Area { get; set; }
        public string? Suggestion { get; set; }
    }

    public class CvRoadmapStepDTO
    {
        public int Step { get; set; }
        public string? Action { get; set; }
        public string? Reason { get; set; }
    }

    public class CvRelevantJobDTO
    {
        public long JobId { get; set; }
        public string? JobTitle { get; set; }
        public string? CompanyName { get; set; }
        public string? MatchReason { get; set; }
    }

    public class ResJobWithScoreDTO
    {
        public int Score { get; set; }
        public ResFetchJobDTO? Job { get; set; }

        public ResJobWithScoreDTO() { }
        public ResJobWithScoreDTO(int score, ResFetchJobDTO job)
        {
            Score = score;
            Job = job;
        }
    }

    public class ResCandidateWithScoreDTO
    {
        public int Score { get; set; }
        public ResUserDetailDTO? Candidate { get; set; }

        public ResCandidateWithScoreDTO() { }
        public ResCandidateWithScoreDTO(int score, ResUserDetailDTO candidate)
        {
            Score = score;
            Candidate = candidate;
        }
    }
}
