package vn.hoidanit.JobZone.domain.response;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResInitiateCandidateSearchDTO extends ResFindCandidatesDTO {
    private String searchId;

    public ResInitiateCandidateSearchDTO(List<ResCandidateWithScoreDTO> candidates, Meta meta, String searchId) {
        super(candidates, meta);
        this.searchId = searchId;
    }
}