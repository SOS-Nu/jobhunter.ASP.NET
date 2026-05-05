package vn.hoidanit.JobZone.domain.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ResDashboardDTO {
    private long totalUsers;
    private long totalCompanies;
    private long totalJobs;
    private long totalResumesApproved;
}