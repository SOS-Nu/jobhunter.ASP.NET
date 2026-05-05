package vn.hoidanit.JobZone.domain.response.resume;

import java.time.Instant;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResCreateResumeDTO {
    private long id;
    private String coverLetter;
    private Instant createdAt;
    private String createdBy;
}
