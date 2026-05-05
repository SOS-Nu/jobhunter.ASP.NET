package vn.hoidanit.JobZone.service;

import java.util.Map;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.stereotype.Service;

import vn.hoidanit.JobZone.domain.response.ResDashboardDTO;
import vn.hoidanit.JobZone.repository.CompanyRepository;
import vn.hoidanit.JobZone.repository.DashboardRepository;
import vn.hoidanit.JobZone.repository.JobRepository;
import vn.hoidanit.JobZone.repository.ResumeRepository;
import vn.hoidanit.JobZone.repository.UserRepository;
import vn.hoidanit.JobZone.util.constant.ResumeStateEnum;

@EnableCaching
@Service
public class DashboardService {
    private final DashboardRepository dashboardRepository;

    public DashboardService(DashboardRepository dashboardRepository) {
        this.dashboardRepository = dashboardRepository;
    }

    public ResDashboardDTO getDashboardStats() {
        Map<String, Long> stats = dashboardRepository.getDashboardStats();
        return new ResDashboardDTO(
                stats.get("totalUsers"),
                stats.get("totalCompanies"),
                stats.get("totalJobs"),
                stats.get("totalResumesApproved"));
    }
}
