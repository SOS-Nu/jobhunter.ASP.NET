namespace JobZone.ASP.NET.DTOs.Response
{
    public class ResBulkCreateJobDTO
    {
        public int Total { get; set; }
        public int Success { get; set; }
        public int Failed { get; set; }
        public List<string> FailedJobs { get; set; } = new();

        public ResBulkCreateJobDTO() { }

        public ResBulkCreateJobDTO(int total, int success, int failed, List<string> failedJobs)
        {
            Total = total;
            Success = success;
            Failed = failed;
            FailedJobs = failedJobs;
        }
    }

    public class ResBulkCreateUserDTO
    {
        public int Total { get; set; }
        public int Success { get; set; }
        public int Failed { get; set; }
        public List<string> FailedEmails { get; set; } = new();

        public ResBulkCreateUserDTO() { }

        public ResBulkCreateUserDTO(int total, int success, int failed, List<string> failedEmails)
        {
            Total = total;
            Success = success;
            Failed = failed;
            FailedEmails = failedEmails;
        }
    }

    public class ResBulkCreateSkillDTO
    {
        public int Total { get; set; }
        public int Success { get; set; }
        public int Failed { get; set; }
        public List<string> FailedSkills { get; set; } = new();

        public ResBulkCreateSkillDTO() { }

        public ResBulkCreateSkillDTO(int total, int success, int failed, List<string> failedSkills)
        {
            Total = total;
            Success = success;
            Failed = failed;
            FailedSkills = failedSkills;
        }
    }
}
