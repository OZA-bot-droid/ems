package com.ems.member.member.domain;

import com.ems.member.common.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

// 로직을 DB가 아니라 Java 서비스 계층에서 명확하게 관리하려고 했기 때문에 java에서 db 저장
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Table(name = "refresh_token_history")
public class RefreshTokenHistory extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = false, name = "session_id")
    private String sessionId;

    // 폐기 토큰이 중복 기록 막기
    @Column(nullable = false, unique = true, name = "token_hash")
    private String tokenHash;

    // refresh token 폐기 시점
    @Column(nullable = false, name = "revoked_at")
    private Instant revokedAt;
}
