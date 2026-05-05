package vn.hoidanit.JobZone.domain.dto.ai;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class ResCompanyEvaluationDTO {
    private Integer trustScore;
    private ScamReport scamReport;
    private BenefitsReview benefits;
    private WorkingEnvironment environment;
    private String overallVerdict; // Kết luận tổng quát

    @Getter
    @Setter
    public static class ScamReport {
        private Boolean isWarning; // Có dấu hiệu lừa đảo không
        private List<String> redFlags; // Các dấu hiệu nghi vấn (đa cấp, địa chỉ ma...)
        private String detail;
    }

    @Getter
    @Setter
    public static class BenefitsReview {
        private String insuranceStatus; // Vấn đề bảo hiểm xã hội
        private String salaryReview; // Review về lương/thưởng
        private List<String> pros;
        private List<String> cons;
    }

    @Getter
    @Setter
    public static class WorkingEnvironment {
        private String workLifeBalance; // Cân bằng công việc/cuộc sống
        private String pressureLevel; // Mức độ bóc lột/áp lực
        private String culture;
    }
}