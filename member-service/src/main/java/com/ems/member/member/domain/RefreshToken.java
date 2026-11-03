package com.ems.member.member.domain;

import com.ems.member.common.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Builder
@Table(name = "refresh_token")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)  // 무분별한 사용을 제한
@AllArgsConstructor
public class RefreshToken extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    // 세션 id
    @Column(name = "session_id", nullable = false, unique = true)
    private UUID sessionId;

    // 하나의 프롬프트 id => UUID
    @Column(name = "client_id")
    private UUID clientId;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    public static RefreshToken toBuilder(Member member, String tokenHash, UUID clientId, long refreshTokenExpiration) {

        return RefreshToken.builder()
                .member(member)
                .tokenHash(tokenHash)
                .clientId(clientId)
                .sessionId(UUID.randomUUID())
                .expiresAt(Instant.now().plusSeconds(refreshTokenExpiration))
                .build();
    }

    public static RefreshToken toBuilder(Member member, String tokenHash, UUID clientId, long refreshTokenExpiration, UUID sessionId) {

        return RefreshToken.builder()
                .member(member)
                .tokenHash(tokenHash)
                .clientId(clientId)
                .sessionId(sessionId)
                .expiresAt(Instant.now().plusSeconds(refreshTokenExpiration))
                .build();
    }

    public void rotate(String newTokenHash, Instant newExpiresAt) {

        this.tokenHash = newTokenHash;
        this.expiresAt = newExpiresAt;
    }
}
