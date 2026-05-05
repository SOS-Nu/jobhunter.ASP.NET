package vn.hoidanit.JobZone.domain.response.projection;

public interface CompanyRatingDTO {
    Long getCompanyId();

    Double getAverageRating();

    Long getTotalComments();
}