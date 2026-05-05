package vn.hoidanit.JobZone.domain.response;

public class PaymentUrlResponseDTO {
    private String url;

    public PaymentUrlResponseDTO(String url) {
        this.url = url;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }
}