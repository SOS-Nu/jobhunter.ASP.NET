package vn.hoidanit.JobZone.domain.response.ai;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResInterviewQuestionsDTO {
    private List<QuestionDetail> questions;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionDetail {
        private String question;
        private String category; // e.g., Technical, Behavioral, Situational
        private String targetedSkill; // Kỹ năng mà câu hỏi này đang kiểm tra
        private String hint; // Gợi ý hướng trả lời cho ứng viên
    }
}