package vn.hoidanit.JobZone.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.hoidanit.JobZone.domain.entity.Otp;

import java.time.Instant;
import java.util.Optional;

public interface OtpRepository extends JpaRepository<Otp, Long> {
    Optional<Otp> findByEmailAndOtpCodeAndUsedFalseAndExpiresAtAfter(String email, String otpCode, Instant now);
}