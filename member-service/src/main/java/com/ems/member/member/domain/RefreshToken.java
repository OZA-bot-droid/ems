package com.ems.member.member.domain;

import com.ems.member.common.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Builder
@Table(name = "refresh_token")
@NoArgsConstructor(access = AccessLevel.PROTECTED)  // 무분별한 사용을 제한
@AllArgsConstructor
public class RefreshToken extends BaseEntity {

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(nullable = false, unique = true, length = 1000)
    private String token;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;
}
