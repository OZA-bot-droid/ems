package com.ems.member.member.domain;

import com.ems.member.common.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "password_reset_token")
public class PasswordResetToken extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "user_at")
    private Instant usedAt;

    public static PasswordResetToken toBuilder(Member member, String tokenHash, long expirationSeconds) {
        return PasswordResetToken.builder()
                .member(member)
                .tokenHash(tokenHash)
                .expiresAt(Instant.now().plusSeconds(expirationSeconds))
                .build();
    }
}
