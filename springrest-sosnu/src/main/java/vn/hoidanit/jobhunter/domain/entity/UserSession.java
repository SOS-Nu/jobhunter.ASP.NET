package vn.hoidanit.JobZone.domain.entity;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "user_sessions")
@Getter
@Setter
public class UserSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnore // Quan trọng: tránh vòng lặp vô hạn khi serialize
    private User user;

    @Column(nullable = false, unique = true)
    private String refreshTokenJti; // JTI (ID) của Refresh Token

    private String ipAddress;

    @Column(columnDefinition = "TEXT")
    private String userAgent;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant lastUsedAt; // Cập nhật khi refresh

    @Column(nullable = false)
    private Instant expiresAt; // Thời hạn của refresh token

    @PrePersist
    public void onPrePersist() {
        this.createdAt = Instant.now();
        this.lastUsedAt = Instant.now();
    }

    @PreUpdate
    public void onPreUpdate() {
        this.lastUsedAt = Instant.now();
    }
}