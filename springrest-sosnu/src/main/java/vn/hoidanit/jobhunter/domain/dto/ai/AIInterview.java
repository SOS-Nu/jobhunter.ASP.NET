package vn.hoidanit.JobZone.domain.dto.ai;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

public class AIInterview {
    // DTO gửi lên từ Frontend
    @Getter
    @Setter
    public static class ReqInterviewAnswerDTO {
        private long jobId;
        private List<AnswerItem> answers;

        @Getter
        @Setter
        public static class AnswerItem {
            private String question;
            private String answer;
        }

    }

    // DTO trả về kết quả chấm điểm
    @Getter
    @Setter
    public static class ResInterviewFeedbackDTO {
        private double overallScore; // Thang điểm 10
        private String generalComment; // Nhận xét tổng quan
        private List<FeedbackDetail> details;

        @Getter
        @Setter
        public static class FeedbackDetail {
            private String question;
            private double score;
            private String strengths; // Điểm tốt
            private String improvements; // Điểm cần cải thiện
            private String modelAnswer; // Câu trả lời mẫu tối ưu
        }
    }
}
