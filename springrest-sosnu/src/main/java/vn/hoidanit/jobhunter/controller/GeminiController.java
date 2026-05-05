package vn.hoidanit.JobZone.controller;

import java.io.IOException;
import java.net.URISyntaxException;

import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.turkraft.springfilter.boot.Filter;

import jakarta.validation.Valid;
import vn.hoidanit.JobZone.domain.dto.ai.AIInterview.ReqInterviewAnswerDTO;
import vn.hoidanit.JobZone.domain.dto.ai.AIInterview.ResInterviewFeedbackDTO;
import vn.hoidanit.JobZone.domain.dto.ai.ResCompanyEvaluationDTO;
import vn.hoidanit.JobZone.domain.response.ResultPaginationDTO;
import vn.hoidanit.JobZone.domain.response.ai.ResCvEvaluationDTO;
import vn.hoidanit.JobZone.domain.response.ai.ResInterviewQuestionsDTO;
import vn.hoidanit.JobZone.domain.entity.Job;
import vn.hoidanit.JobZone.domain.entity.User;
import org.springframework.data.jpa.domain.Specification;
import vn.hoidanit.JobZone.service.FileService;
import vn.hoidanit.JobZone.service.GeminiService;
import vn.hoidanit.JobZone.util.annotation.ApiMessage;
import vn.hoidanit.JobZone.util.error.IdInvalidException;

@RestController
@RequestMapping("/api/v1/gemini")
public class GeminiController {

    private final GeminiService geminiService;
    private final FileService fileService;

    public GeminiController(GeminiService geminiService, FileService fileService) {
        this.geminiService = geminiService;
        this.fileService = fileService;
    }

    // ================= START: API TÌM KIẾM ỨNG VIÊN MỚI =================

    @PostMapping("/candidates")
    @ApiMessage("Tìm kiếm ứng viên bằng AI kết hợp bộ lọc (địa điểm, tuổi, role...)")
    public ResponseEntity<ResultPaginationDTO> findCandidatesAI(
            @RequestParam(name = "jobDescription", required = false) String jobDescription,
            @RequestParam(name = "file", required = false) MultipartFile file,
            @Filter Specification<User> spec,
            Pageable pageable) throws IdInvalidException, IOException {

        String finalJobDescription = jobDescription;
        if (file != null && !file.isEmpty()) {
            finalJobDescription = fileService.extractTextFromBytes(file.getBytes());
        }

        if (finalJobDescription == null || finalJobDescription.trim().isEmpty()) {
            throw new IdInvalidException("Vui lòng cung cấp mô tả công việc hoặc file.");
        }

        return ResponseEntity.ok(geminiService.findCandidatesWithAI(spec, finalJobDescription, pageable));
    }

    // ================= END: API TÌM KIẾM ỨNG VIÊN MỚI =================

    @PostMapping("/jobs")
    @ApiMessage("Tìm kiếm việc làm bằng AI kết hợp bộ lọc (địa điểm, lương, skills...)")
    public ResponseEntity<ResultPaginationDTO> findJobsAI(
            @RequestParam(name = "skillsDescription", required = false) String skillsDescription,
            @RequestParam(name = "file", required = false) MultipartFile file,
            @Filter Specification<Job> spec,
            Pageable pageable) throws IdInvalidException, IOException {

        byte[] cvFileBytes = (file != null && !file.isEmpty()) ? file.getBytes() : null;

        if ((skillsDescription == null || skillsDescription.trim().isEmpty()) && cvFileBytes == null) {
            throw new IdInvalidException("Vui lòng cung cấp mô tả kỹ năng hoặc tải lên file CV.");
        }

        return ResponseEntity.ok(geminiService.findJobsWithAI(spec, skillsDescription, cvFileBytes, pageable));
    }

    @PostMapping("/evaluate-cv")
    public ResponseEntity<ResCvEvaluationDTO> evaluateCv(
            @RequestParam(value = "cvFile", required = false) MultipartFile cvFile,
            // <<< THÊM THAM SỐ NGÔN NGỮ >>>
            @RequestParam(value = "language", defaultValue = "vi") String language)
            throws IdInvalidException, IOException {

        // Truyền tham số ngôn ngữ vào service
        ResCvEvaluationDTO result = this.geminiService.evaluateCandidateCv(cvFile, language);
        return ResponseEntity.ok(result);
    }

    // Thêm vào GeminiController.java

    @PostMapping("/mock-interview")
    public ResponseEntity<ResInterviewQuestionsDTO> getMockInterview(
            @RequestParam("jobId") long jobId,
            @RequestParam(value = "quantity", defaultValue = "8") int quantity, // Mặc định là 10
            @RequestParam(value = "language", defaultValue = "vi") String language)
            throws IdInvalidException, IOException, URISyntaxException {

        // Gọi đúng 3 tham số như đã định nghĩa trong Service
        ResInterviewQuestionsDTO result = this.geminiService.generateMockInterviewQuestions(jobId, quantity, language);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/evaluate-interview")
    @ApiMessage("Chấm điểm và nhận xét câu trả lời phỏng vấn giả lập")
    public ResponseEntity<ResInterviewFeedbackDTO> evaluateInterview(
            @RequestBody ReqInterviewAnswerDTO request,
            @RequestParam(value = "language", defaultValue = "vi") String language)
            throws IdInvalidException, IOException, URISyntaxException {

        if (request.getAnswers() == null || request.getAnswers().isEmpty()) {
            throw new IdInvalidException("Danh sách câu trả lời không được trống.");
        }

        ResInterviewFeedbackDTO result = this.geminiService.evaluateInterviewAnswers(request, language);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/evaluate-company/{id}")
    @ApiMessage("AI đánh giá uy tín và chế độ của công ty")
    public ResponseEntity<ResCompanyEvaluationDTO> evaluateCompany(
            @PathVariable("id") long id,
            @RequestParam(value = "language", defaultValue = "vi") String language)
            throws IdInvalidException {

        ResCompanyEvaluationDTO result = this.geminiService.evaluateCompany(id, language);
        return ResponseEntity.ok(result);
    }
}
