package vn.hoidanit.JobZone.service;

import java.io.IOException;
import java.net.URISyntaxException;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.Client;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;

import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import vn.hoidanit.JobZone.domain.dto.ai.AIInterview.ReqInterviewAnswerDTO;
import vn.hoidanit.JobZone.domain.dto.ai.AIInterview.ResInterviewFeedbackDTO;
import vn.hoidanit.JobZone.domain.dto.ai.ResCompanyEvaluationDTO;
import vn.hoidanit.JobZone.domain.entity.Comment;
import vn.hoidanit.JobZone.domain.entity.Company;
import vn.hoidanit.JobZone.domain.entity.Job;
import vn.hoidanit.JobZone.domain.entity.Skill;
import vn.hoidanit.JobZone.domain.entity.User;
import vn.hoidanit.JobZone.domain.response.ResCandidateWithScoreDTO;
import vn.hoidanit.JobZone.domain.response.ResUserDetailDTO;
import vn.hoidanit.JobZone.domain.response.ResultPaginationDTO;
import vn.hoidanit.JobZone.domain.response.ai.ResCvEvaluationDTO;
import vn.hoidanit.JobZone.domain.response.ai.ResInterviewQuestionsDTO;
import vn.hoidanit.JobZone.domain.response.job.ResJobWithScoreDTO;
import vn.hoidanit.JobZone.repository.CommentRepository;
import vn.hoidanit.JobZone.repository.CompanyRepository;
import vn.hoidanit.JobZone.repository.JobRepository;
import vn.hoidanit.JobZone.repository.UserRepository;
import vn.hoidanit.JobZone.util.SecurityUtil;
import vn.hoidanit.JobZone.util.error.IdInvalidException;

@Service
@Slf4j
public class GeminiService {
    private static final String GEMINI_MODEL = "gemini-2.5-flash-lite";

    private static final GenerateContentConfig FAST_JSON_CONFIG = GenerateContentConfig.builder()
            .temperature(0.2f)
            .topP(0.95f)
            .maxOutputTokens(8000)
            .responseMimeType("application/json")
            .build();

    private final Client geminiClient;
    private final UserService userService;
    private final FileService fileService;
    private final ObjectMapper objectMapper;
    private final JobRepository jobRepository;
    private final JobService jobService;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final CompanyRepository companyRepository;
    @Value("${gemini.api.key}")
    private String geminiApiKey;

    // @Value("${gemini.api.url}")
    // private String geminiApiUrl;

    public GeminiService(RestTemplate restTemplate, UserService userService, FileService fileService,
            ObjectMapper objectMapper, JobRepository jobRepository, JobService jobService,
            UserRepository userRepository, Client geminiClient,
            SkillService skillService, CommentRepository commentRepository, CompanyRepository companyRepository) {
        this.userService = userService;
        this.fileService = fileService;
        this.objectMapper = objectMapper;
        this.jobRepository = jobRepository;
        this.jobService = jobService;
        this.userRepository = userRepository;
        this.geminiClient = geminiClient;
        this.commentRepository = commentRepository;
        this.companyRepository = companyRepository;
    }

    // #region gemini find job, find candidate, evaluate cv
    // #region Find Candidates (Single Step)
    /**
     * Tìm kiếm ứng viên bằng AI kết hợp bộ lọc DB (địa điểm, role, skills...).
     */
    public ResultPaginationDTO findCandidatesWithAI(Specification<User> spec, String jobDescription,
            Pageable pageable) {
        log.info(">>> [AI Search] Finding candidates with filters and ranking...");

        // 1. Lấy danh sách ứng viên tiềm năng từ DB theo bộ lọc (Lấy max 100 để rank)
        List<User> filteredUsers = userRepository.findAll(spec,
                PageRequest.of(0, 100, Sort.by("id").descending())).getContent();

        if (filteredUsers.isEmpty()) {
            return new ResultPaginationDTO();
        }

        // 2. Chuyển sang DTO để AI xử lý (rankUsersWithGemini nhận ResUserDetailDTO)
        List<ResUserDetailDTO> userDTOs = filteredUsers.stream()
                .map(ResUserDetailDTO::convertToDTO)
                .collect(Collectors.toList());

        // 3. AI Chấm điểm
        List<GeminiScoreResponse> scores = rankUsersWithGemini(jobDescription, userDTOs);

        // 4. Map điểm và sắp xếp
        Map<Long, Integer> scoreMap = scores.stream()
                .collect(Collectors.toMap(GeminiScoreResponse::getUserId, GeminiScoreResponse::getScore, (a, b) -> a));

        List<ResCandidateWithScoreDTO> allResults = userDTOs.stream()
                .filter(u -> scoreMap.getOrDefault(u.getId(), 0) > 30)
                .map(u -> new ResCandidateWithScoreDTO(scoreMap.get(u.getId()), u))
                .sorted(Comparator.comparing(ResCandidateWithScoreDTO::getScore).reversed())
                .collect(Collectors.toList());

        // 5. Phân trang thủ công trên kết quả AI
        return manualPaginate(allResults, pageable);
    }
    // #endregion

    // #region Find Jobs (Single Step)
    /**
     * Tìm kiếm việc làm bằng AI kết hợp bộ lọc DB.
     */
    public ResultPaginationDTO findJobsWithAI(Specification<Job> spec, String skillsDescription, byte[] cvFileBytes,
            Pageable pageable) throws IOException {
        log.info(">>> [AI Search] Finding jobs with filters and ranking...");

        // 1. Lấy danh sách việc làm tiềm năng (Lấy max 100 để rank)
        List<Job> filteredJobs = jobRepository.findAll(spec,
                PageRequest.of(0, 100, Sort.by("id").descending())).getContent();

        if (filteredJobs.isEmpty()) {
            return new ResultPaginationDTO();
        }

        // 2. Trích xuất văn bản từ CV
        String cvText = (cvFileBytes != null) ? fileService.extractTextFromBytes(cvFileBytes) : "";

        // 3. AI Chấm điểm
        List<GeminiJobScoreResponse> scores = rankJobsWithGemini(skillsDescription, cvText, filteredJobs);

        // 4. Map điểm và sắp xếp
        Map<Long, Integer> scoreMap = scores.stream()
                .collect(Collectors.toMap(GeminiJobScoreResponse::getJobId, GeminiJobScoreResponse::getScore,
                        (a, b) -> a));

        List<ResJobWithScoreDTO> allResults = filteredJobs.stream()
                .filter(j -> scoreMap.getOrDefault(j.getId(), 0) > 30)
                .map(j -> new ResJobWithScoreDTO(scoreMap.get(j.getId()), jobService.convertToResFetchJobDTO(j)))
                .sorted(Comparator.comparing(ResJobWithScoreDTO::getScore).reversed())
                .collect(Collectors.toList());

        // 5. Phân trang thủ công
        return manualPaginate(allResults, pageable);
    }

    private <T> ResultPaginationDTO manualPaginate(List<T> allResults, Pageable pageable) {
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), allResults.size());

        List<T> pageContent = (start < allResults.size()) ? allResults.subList(start, end) : Collections.emptyList();

        ResultPaginationDTO rs = new ResultPaginationDTO();
        ResultPaginationDTO.Meta mt = new ResultPaginationDTO.Meta();
        mt.setPage(pageable.getPageNumber() + 1);
        mt.setPageSize(pageable.getPageSize());
        mt.setTotal(allResults.size());
        mt.setPages((int) Math.ceil((double) allResults.size() / pageable.getPageSize()));

        rs.setMeta(mt);
        rs.setResult(pageContent);
        return rs;
    }
    // #endregion

    @Getter
    @Setter
    public static class GeminiScoreResponse {
        private long userId;
        private int score;
    }

    private List<GeminiScoreResponse> rankUsersWithGemini(String jobDescription, List<ResUserDetailDTO> users) {
        log.info(">>> Calling Gemini SDK to rank {} users", users.size());

        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append(
                "You are an expert HR assistant. Based on the following job description, analyze each candidate. ");
        promptBuilder.append("Prioritize the resume text. \n\n");
        promptBuilder.append("Job Description:\n\"").append(jobDescription).append("\"\n\n");

        for (ResUserDetailDTO userDetail : users) {
            try {
                User userEntity = this.userService.fetchUserById(userDetail.getId());
                if (userEntity == null)
                    continue;

                StringBuilder combinedResumeText = new StringBuilder();

                if (userEntity.getOnlineResume() != null) {
                    combinedResumeText.append("--- ONLINE RESUME ---\n")
                            .append(buildTextFromOnlineResume(userEntity)).append("\n\n");
                }

                String mainResumeFileName = userEntity.getMainResume();
                if (mainResumeFileName != null && !mainResumeFileName.isEmpty()) {
                    try {
                        String fileResumeText = fileService.extractTextFromStoredFile(mainResumeFileName, "resumes");
                        if (fileResumeText != null && !fileResumeText.trim().isEmpty()) {
                            combinedResumeText.append("--- UPLOADED CV FILE ---\n").append(fileResumeText).append("\n");
                        }
                    } catch (IOException | URISyntaxException e) {
                        log.warn("Could not extract text from file {} for user {}: {}", mainResumeFileName,
                                userEntity.getId(), e.getMessage());
                    }
                }

                promptBuilder.append("Candidate ID: ").append(userDetail.getId()).append("\n");
                userDetail.setMainResume(null);
                promptBuilder.append("Metadata: ").append(objectMapper.writeValueAsString(userDetail)).append("\n");
                promptBuilder.append("Resume Content:\n").append(combinedResumeText).append("\n");
                promptBuilder.append("--------------------------------------------------\n");

            } catch (Exception e) {
                log.error("Error preparing data for user ID {}: {}", userDetail.getId(), e.getMessage());
            }
        }

        promptBuilder.append(
                "\n\nAfter analyzing, return a JSON array. Objects must have 'userId' (number) and 'score' (0-100). ");
        promptBuilder.append("Filter score > 50. Sort desc. Format: [{\"userId\": 1, \"score\": 90}, ...]");

        return callGeminiAndParseList(promptBuilder.toString(), GeminiScoreResponse.class);
    }

    /**
     * ĐÃ CẬP NHẬT: Gửi thông tin ứng viên dưới dạng text thay vì file
     */
    private List<GeminiJobScoreResponse> rankJobsWithGemini(String userQuery, String cvText, List<Job> jobs) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Act as a STRICT Job Filter. Match jobs to USER QUERY.\n\n");

        // Input Data
        prompt.append("USER QUERY: '").append(userQuery).append("'\n");

        try {
            prompt.append("CANDIDATES (JSON): ").append(convertJobsToJson(jobs)).append("\n\n");
        } catch (Exception e) {
            return Collections.emptyList();
        }

        prompt.append("--- STRICT FILTERING RULES ---\n");
        prompt.append(
                "1. SALARY: If user asks for specific salary X, accept ONLY range [X-15%, X+15%]. Outside = REJECT.\n");
        prompt.append("2. LOCATION: Exact City match required (e.g. HCM != Hanoi). Different City = REJECT.\n");
        prompt.append("3. RELEVANCE: Tech stack/Title must match intent. Irrelevant = REJECT.\n");

        prompt.append("\n--- OUTPUT FORMAT ---\n");
        prompt.append("Return a JSON Array of matching jobs ONLY: [{\"jobId\": 123, \"score\": 90}].\n");
        prompt.append(
                "IMPORTANT: If a job is REJECTED or Score < 50, DO NOT include it in the output array. Return an empty array [] if no jobs match.");

        return callGeminiAndParseList(prompt.toString(), GeminiJobScoreResponse.class);
    }

    // =========================================================================
    // HELPER METHODS (CLEAN ARCHITECTURE & REUSE)
    // =========================================================================

    /**
     * Generic method to call Gemini and parse a JSON List response
     */
    private <T> List<T> callGeminiAndParseList(String prompt, Class<T> clazz) {
        try {
            // CẬP NHẬT Ở ĐÂY: Thêm FAST_JSON_CONFIG
            GenerateContentResponse response = geminiClient.models.generateContent(
                    GEMINI_MODEL,
                    prompt,
                    FAST_JSON_CONFIG // <--- Thay null bằng config
            );

            String textResponse = response.text();
            String cleanedJson = cleanJson(textResponse);

            return objectMapper.readValue(cleanedJson,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, clazz));
        } catch (Exception e) {
            log.error("Gemini SDK Call Failed: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Utility làm sạch chuỗi JSON trả về từ AI (thường bị bao bởi ```json ... ```)
     */
    private String cleanJson(String rawText) {
        if (rawText == null)
            return "{}";
        String cleaned = rawText.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }
        return cleaned.trim();
    }

    // PHƯƠNG THỨC MỚI CỐT LÕI
    public ResCvEvaluationDTO evaluateCandidateCv(MultipartFile cvFile, String language)
            throws IdInvalidException, IOException {
        String email = SecurityUtil.getCurrentUserLogin().orElseThrow(() -> new IdInvalidException("User not found"));
        User currentUser = this.userRepository.findByEmail(email);

        String cvAsText;
        if (cvFile != null && !cvFile.isEmpty()) {
            cvAsText = fileService.extractTextFromBytes(cvFile.getBytes());
        } else {
            cvAsText = buildTextFromOnlineResume(currentUser);
        }

        if (cvAsText == null || cvAsText.trim().isEmpty()) {
            throw new IOException("CV content is empty.");
        }

        // Lấy 50 job gần nhất để tiết kiệm token
        Pageable pageable = PageRequest.of(0, 50, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<Job> recentJobs = this.jobRepository.findAll((root, query, cb) -> cb.isTrue(root.get("active")), pageable)
                .getContent();
        String jobsJson = convertJobsToJson(recentJobs);

        String prompt = buildCvEvaluationPrompt(cvAsText, jobsJson, language);

        try {
            // CẬP NHẬT Ở ĐÂY: Thêm FAST_JSON_CONFIG
            GenerateContentResponse response = geminiClient.models.generateContent(
                    GEMINI_MODEL,
                    prompt,
                    FAST_JSON_CONFIG);

            String cleanedJson = cleanJson(response.text());
            return objectMapper.readValue(cleanedJson, ResCvEvaluationDTO.class);
        } catch (Exception e) {
            log.error("Error calling Gemini SDK (evaluateCv): {}", e.getMessage());
            throw new IOException("Failed to analyze CV with AI.", e);
        }
    }

    // Hàm helper để tạo nội dung text từ Online Resume
    private String buildTextFromOnlineResume(User user) {
        if (user.getOnlineResume() == null)
            return "";

        StringBuilder sb = new StringBuilder();
        sb.append("Title: ").append(user.getOnlineResume().getTitle()).append("\n");
        sb.append("Full Name: ").append(user.getOnlineResume().getFullName()).append("\n");
        sb.append("Email: ").append(user.getOnlineResume().getEmail()).append("\n");
        sb.append("Phone: ").append(user.getOnlineResume().getPhone()).append("\n");
        sb.append("Address: ").append(user.getOnlineResume().getAddress()).append("\n\n");

        sb.append("Summary:\n").append(user.getOnlineResume().getSummary()).append("\n\n");

        sb.append("Skills:\n");
        user.getOnlineResume().getSkills().forEach(skill -> sb.append("- ").append(skill.getName()).append("\n"));
        sb.append("\n");

        if (user.getWorkExperiences() != null && !user.getWorkExperiences().isEmpty()) {
            sb.append("Work Experience:\n");
            user.getWorkExperiences().forEach(exp -> {
                sb.append("- Company: ").append(exp.getCompanyName()).append("\n");
                sb.append("  Duration: ").append(exp.getStartDate()).append(" to ").append(exp.getEndDate())
                        .append("\n");
                sb.append("  Description: ").append(exp.getDescription()).append("\n\n");
            });
        }

        return sb.toString();
    }

    // Hàm helper để convert danh sách Job thành chuỗi JSON đơn giản
    private String convertJobsToJson(List<Job> jobs) {
        // Sử dụng ObjectNode của Jackson hoặc Map gọn nhẹ
        List<Map<String, Object>> simplifiedJobs = jobs.stream().map(job -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", job.getId()); // Đổi key ngắn hơn
            map.put("title", job.getName());
            map.put("skills", job.getSkills().stream().map(Skill::getName).collect(Collectors.toList()));
            // Chỉ lấy 500 ký tự đầu của description để tiết kiệm token, AI vẫn hiểu được
            // ngữ cảnh
            String desc = job.getDescription() != null ? job.getDescription() : "";
            map.put("desc", desc.length() > 500 ? desc.substring(0, 500) + "..." : desc);
            map.put("loc", job.getLocation()); // location
            map.put("salary", String.format("%.0f", job.getSalary()));
            map.put("lvl", job.getLevel()); // level

            if (job.getCompany() != null) {
                map.put("comp", job.getCompany().getName());
                map.put("field", job.getCompany().getField()); // Outsourcing/Product
                map.put("scale", job.getCompany().getScale());
                map.put("country", job.getCompany().getCountry());
            }
            return map;
        }).collect(Collectors.toList());

        try {
            return objectMapper.writeValueAsString(simplifiedJobs);
        } catch (Exception e) {
            return "[]";
        }
    }

    // Hàm helper quan trọng nhất: tạo prompt
    private String buildCvEvaluationPrompt(String cvText, String jobsJson, String language) {
        // Logic để tạo chỉ thị ngôn ngữ dựa trên tham số 'language'
        String languageInstruction = language.equalsIgnoreCase("en")
                ? "You must provide the entire response in English. All keys and values in the JSON must be in English."
                : "Bạn phải cung cấp toàn bộ phản hồi bằng Tiếng Việt. Mọi khóa và giá trị trong JSON phải là Tiếng Việt.";

        String marketContext = language.equalsIgnoreCase("en")
                ? "the Vietnamese IT market"
                : "thị trường IT Việt Nam";

        // Xây dựng prompt hoàn chỉnh
        return "You are an expert HR and career advisor for " + marketContext + ". "
        // Thêm chỉ thị ngôn ngữ vào ngay đầu prompt
                + languageInstruction + " "
                + "Analyze the following CV. "
                + "Provide a comprehensive evaluation in a single, valid JSON object. The JSON object must have the exact following structure: "
                + "{\"overallScore\": number, \"summary\": string, \"strengths\": string[], \"improvements\": [{\"area\": string, \"suggestion\": string}], \"estimatedSalaryRange\": string, \"suggestedRoadmap\": [{\"step\": number, \"action\": string, \"reason\": string}], \"relevantJobs\": [{\"jobId\": number, \"jobTitle\": string, \"companyName\": string, \"matchReason\": string}]}. "
                + "\n\nHere are the evaluation criteria:"
                + "\n1.  **overallScore**: An integer score from 0 to 100 based on clarity, experience, skills, and suitability for the current job market."
                + "\n2.  **summary**: A short, professional summary of the candidate's profile in 2-3 sentences."
                + "\n3.  **strengths**: An array of strings highlighting the candidate's key strengths (e.g., 'Strong experience in microservices architecture', 'Proficient with React and state management')."
                + "\n4.  **improvements**: An array of objects. For each object, 'area' is the section to improve (e.g., 'Project Descriptions', 'Skills Section') and 'suggestion' is a concrete action (e.g., 'Quantify achievements with metrics like 20% performance improvement', 'Add soft skills like teamwork and problem-solving')."
                + "\n5.  **estimatedSalaryRange**: A string representing the estimated appropriate monthly salary range in VND (e.g., '35,000,000 - 45,000,000 VND'). Base this on the skills, experience, and current market rates in Vietnam."
                + "\n6.  **suggestedRoadmap**: A personalized roadmap with 3-5 steps. For each step, 'action' is what to learn or do, and 'reason' explains how it helps them achieve a higher level job or salary."
                + "\n7.  **relevantJobs**: Analyze the list of available jobs provided below. Select the 3-5 most suitable jobs for this candidate. For each, provide 'jobId', 'jobTitle', 'companyName', and a 'matchReason' explaining why it's a good fit."
                + "\n\n---"
                + "\n**CANDIDATE'S CV TEXT:**\n"
                + cvText
                + "\n\n---"
                + "\n**AVAILABLE JOBS FOR REFERENCE:**\n"
                + jobsJson
                + "\n\n---"
                + "\n**RESPONSE (valid JSON object only, no extra text or markdown):**";
    }

    public int scoreCvAgainstJob(Job job, byte[] cvFileBytes, String cvFileName) {
        String jobDetails = String.format("Job Title: %s\nLocation: %s\nLevel: %s\nDescription: %s",
                job.getName(), job.getLocation(), job.getLevel(), job.getDescription());

        String cvText;
        try {
            cvText = fileService.extractTextFromBytes(cvFileBytes);
        } catch (IOException e) {
            log.error("Error extracting text from CV bytes: {}", e.getMessage());
            return 0;
        }

        if (cvText == null || cvText.trim().isEmpty())
            return 0;

        String prompt = "As an expert HR, evaluate this resume against the job description. " +
                "Return ONLY a JSON object: {\"score\": number (0-100)}. \n\n" +
                "Job Description:\n" + jobDetails + "\n\n" +
                "Candidate's Resume Text:\n" + cvText;

        try {
            // CẬP NHẬT Ở ĐÂY: Thêm FAST_JSON_CONFIG
            GenerateContentResponse response = geminiClient.models.generateContent(
                    GEMINI_MODEL,
                    prompt,
                    FAST_JSON_CONFIG // <--- Thay null bằng config
            );

            // Khi dùng mode JSON, đôi khi AI không trả về markdown ```json nữa
            // nhưng vẫn nên giữ cleanJson để an toàn tuyệt đối
            String cleanedJson = cleanJson(response.text());
            JsonNode root = objectMapper.readTree(cleanedJson);
            return root.path("score").asInt(0);
        } catch (Exception e) {
            log.error("Error calling Gemini SDK (scoreCv): {}", e.getMessage());
            return 0;
        }
    }

    // Helper class để parse response
    @Getter
    @Setter
    private static class GeminiJobScoreResponse {
        private long jobId;
        private int score;
    }
    // #endregion

    // #region AI interview
    public ResInterviewQuestionsDTO generateMockInterviewQuestions(
            long jobId,
            int quantity,
            String language) throws IdInvalidException, IOException, URISyntaxException {

        Job job = this.jobRepository.findById(jobId)
                .orElseThrow(() -> new IdInvalidException("Job không tồn tại"));

        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        User currentUser = this.userRepository.findByEmail(email);

        // Xử lý an toàn cho CV Text
        String cvText = "No CV provided";
        if (currentUser != null && currentUser.getMainResume() != null) {
            String extracted = this.fileService.extractTextFromStoredFile(currentUser.getMainResume(), "resume");
            if (extracted != null && !extracted.isBlank()) {
                cvText = extracted;
            }
        }

        String outputLang = language.equalsIgnoreCase("en") ? "English" : "Vietnamese";

        String systemPrompt = String.format(
                """
                        You are a Senior Recruiter. Your task is to generate EXACTLY %d interview questions in %s.

                        CONTEXT:
                        - Job Title: %s
                        - Job Description: %s
                        - Candidate CV: %s

                        STRICT RULES:
                        1. You MUST return exactly %d questions.
                        2. Priority: Match gaps between the CV and JD to create challenging questions.
                        3. Fallback: If the CV or JD is too brief or insufficient to generate %d high-quality questions, use the Job Title "%s" to create professional and creative questions suitable for this role.
                        4. Structure: Ensure a mix of Technical, Behavioral, and Situational questions.

                        OUTPUT FORMAT (Strictly JSON):
                        {
                          "questions": [
                            {
                              "question": "text",
                              "category": "Technical/Behavioral/Situational",
                              "targetedSkill": "skill",
                              "hint": "brief advice"
                            }
                          ]
                        }
                        """,
                quantity, outputLang, job.getName(), job.getDescription(), cvText, quantity, quantity, job.getName());

        try {
            GenerateContentResponse response = geminiClient.models.generateContent(
                    GEMINI_MODEL,
                    systemPrompt,
                    FAST_JSON_CONFIG);

            // --- SỬA TẠI ĐÂY: Sử dụng cleanJson để loại bỏ ```json ---
            String rawText = response.text();
            if (rawText == null || rawText.isBlank()) {
                throw new RuntimeException("AI trả về kết quả rỗng.");
            }

            String cleanedJson = cleanJson(rawText);

            log.info("AI Questions generated successfully for Job ID: {}", jobId);
            return objectMapper.readValue(cleanedJson, ResInterviewQuestionsDTO.class);

        } catch (com.fasterxml.jackson.databind.JsonMappingException e) {
            log.error("Lỗi cấu trúc DTO: AI trả về thiếu field hoặc sai kiểu dữ liệu: {}", e.getMessage());
            throw new RuntimeException("Cấu trúc câu hỏi AI không khớp với hệ thống.");
        } catch (Exception e) {
            log.error("Lỗi thực thi Gemini: Type={}, Message={}", e.getClass().getSimpleName(), e.getMessage());
            throw new RuntimeException("AI hiện tại không thể tạo câu hỏi, vui lòng thử lại sau.");
        }
    }

    /**
     * Chấm điểm và đưa ra feedback cho bộ câu trả lời phỏng vấn.
     */
    public ResInterviewFeedbackDTO evaluateInterviewAnswers(
            ReqInterviewAnswerDTO request,
            String language) throws IdInvalidException, IOException, URISyntaxException {

        // 1. Kiểm tra đầu vào & Ngữ cảnh
        Job job = this.jobRepository.findById(request.getJobId())
                .orElseThrow(() -> new IdInvalidException("Job không tồn tại"));

        String email = SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new IdInvalidException("Vui lòng đăng nhập"));
        User currentUser = this.userRepository.findByEmail(email);

        // Đảm bảo lấy CV an toàn
        String cvText = "No CV available";
        if (currentUser.getMainResume() != null) {
            cvText = this.fileService.extractTextFromStoredFile(currentUser.getMainResume(), "resume");
        }

        String outputLang = language.equalsIgnoreCase("en") ? "English" : "Vietnamese";

        // 2. Format Q&A Context (Sử dụng Stream an toàn)
        String qaContext = request.getAnswers().stream()
                .map(a -> String.format("Q: %s\nA: %s", a.getQuestion(), a.getAnswer()))
                .collect(Collectors.joining("\n---\n"));

        String systemPrompt = String.format(
                """
                        You are a Senior Technical Interviewer. Evaluate the candidate's answers based on the provided JD and CV.
                        Language: %s.

                        CONTEXT:
                        - JD: %s
                        - CV: %s
                        - Q&A:
                        %s

                        OUTPUT FORMAT (Strictly JSON):
                        {
                          "overallScore": 8.5,
                          "generalComment": "...",
                          "details": [
                            {
                              "question": "...",
                              "score": 8.0,
                              "strengths": "...",
                              "improvements": "...",
                              "modelAnswer": "..."
                            }
                          ]
                        }
                        """,
                outputLang, job.getDescription(), cvText, qaContext);

        try {
            GenerateContentResponse response = geminiClient.models.generateContent(
                    GEMINI_MODEL, systemPrompt, FAST_JSON_CONFIG);

            // --- FIX: Sử dụng cleanJson để bóc tách dữ liệu sạch ---
            String rawText = response.text();
            if (rawText == null || rawText.isBlank())
                throw new RuntimeException("AI không phản hồi.");

            String cleanedJson = cleanJson(rawText);
            return objectMapper.readValue(cleanedJson, ResInterviewFeedbackDTO.class);

        } catch (Exception e) {
            log.error("Lỗi đánh giá phỏng vấn: {}", e.getMessage(), e);
            throw new RuntimeException("Hệ thống không thể chấm điểm câu trả lời ngay lúc này.");
        }
    }
    // #endregion

    // #region evulation company
    /**
     * Đánh giá uy tín và chế độ của công ty dựa trên Big Data (Comments, JD,
     * Metadata)
     */

    // #region evulation company
    /**
     * Đánh giá uy tín và chế độ của công ty dựa trên Big Data (Comments, JD,
     * Metadata)
     */
    public ResCompanyEvaluationDTO evaluateCompany(Long companyId, String language) throws IdInvalidException {
        Company company = this.companyRepository.findById(companyId)
                .orElseThrow(() -> new IdInvalidException("Công ty không tồn tại"));

        // 1. Tổng hợp Job (Giới hạn text để tiết kiệm token)
        List<Job> companyJobs = this.jobRepository.findByCompany_Id(companyId);
        String jobsSummary = companyJobs.stream()
                .limit(5) // Chỉ lấy 5
                .map(j -> j.getName() + " (Salary: " + j.getSalary() + ")")
                .collect(Collectors.joining(", "));

        // 2. Tổng hợp Review (Phải truncate nếu comment quá dài)
        Pageable top15 = PageRequest.of(0, 15, Sort.by("createdAt").descending());
        Page<Comment> commentsPage = this.commentRepository.findAll(
                (root, query, cb) -> cb.equal(root.get("company").get("id"), companyId), top15);

        String userComments = commentsPage.getContent().stream()
                .map(c -> String.format("[%s*] %s", c.getRating(), truncate(c.getComment(), 200)))
                .collect(Collectors.joining("\n"));

        // 1. Tạo chỉ thị ngôn ngữ rõ ràng
        String langInstruction = language.equalsIgnoreCase("en")
                ? "Write ALL JSON string values in ENGLISH."
                : "Write ALL JSON string values in VIETNAMESE (Tiếng Việt). ONLY translate the values, keep the JSON keys exactly as requested.";

        // 2. Cập nhật System Prompt
        String systemPrompt = String.format(
                """
                        %s
                        Analyze this company data:
                        Name: %s | Description: %s
                        Jobs: %s
                        Reviews: %s

                        Return ONLY a valid JSON object. Do NOT wrap the response in
                        ```json markdown block.
                        Must strictly follow this structure (Keep the exact keys, but fill the values in the requested language):
                        {
                          "trustScore": 85,
                          "scamReport": { "isWarning": false, "redFlags": ["..."], "detail": "..." },
                          "benefits": { "insuranceStatus": "...", "salaryReview": "...", "pros": ["..."], "cons": ["..."] },
                          "environment": { "workLifeBalance": "...", "pressureLevel": "...", "culture": "..." },
                          "overallVerdict": "..."
                        }
                        """,
                langInstruction, company.getName(), company.getDescription(), jobsSummary, userComments);

        // Khai báo rawText bên ngoài khối try để có thể log khi gặp lỗi
        String rawText = "";
        try {
            GenerateContentResponse response = geminiClient.models.generateContent(
                    GEMINI_MODEL, systemPrompt, FAST_JSON_CONFIG);

            rawText = response.text();

            // Giữ nguyên việc sử dụng hàm cleanJson hiện tại của hệ thống
            String cleanedJson = cleanJson(rawText);

            return objectMapper.readValue(cleanedJson, ResCompanyEvaluationDTO.class);

        } catch (Exception e) {
            // Log chuỗi AI trả về (rawText) và in ra StackTrace (e) để debug
            log.error("Lỗi phân tích JSON cho công ty {}. Raw Text từ AI:\n{}\nChi tiết lỗi:", companyId, rawText, e);
            throw new RuntimeException("AI gặp khó khăn khi đánh giá công ty này.");
        }
    }
    // #endregion

    /**
     * Helper để cắt ngắn chuỗi nếu quá dài, tránh tràn Token (Best Practice)
     */
    private String truncate(String text, int maxLength) {
        if (text == null || text.length() <= maxLength)
            return text;
        return text.substring(0, maxLength) + "...";
    }
    // #endregion

}