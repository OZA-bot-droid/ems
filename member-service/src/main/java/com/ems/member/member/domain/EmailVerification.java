package com.ems.member.member.domain;

import com.ems.member.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;

import java.time.Instant;

@Builder
@Entity
@Getter
@Table(name = "email_verification")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class EmailVerification extends BaseEntity {

    @Column(nullable = false, unique = true, length = 254)
    private String email;

    @Column(name = "code_hash", nullable = false, length = 100)
    private String codeHash;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "resend_at", nullable = false)
    private Instant resendAt;

    @Column(name = "failed_attempts", nullable = false)
    private int failedAttempts;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    public EmailVerification(String email, String codeHash, Instant now) {
        this.email = email;
        renew(codeHash, now);
    }

    public void renew(String codeHash, Instant now) {
        this.codeHash = codeHash;
        this.expiresAt = now.plusSeconds(300);
        this.resendAt = now.plusSeconds(60);
        this.failedAttempts = 0;
        this.verifiedAt = null;
    }

    public void fail() {
        this.failedAttempts++;
    }

    public void verify(Instant now) {
        this.verifiedAt = now;
    }
}
