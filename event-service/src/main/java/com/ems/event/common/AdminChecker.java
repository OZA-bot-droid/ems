package com.ems.event.common;

import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * 관리자(ADMIN)만 할 수 있는 요청인지 검사한다.
 */
@Component
public class AdminChecker {

    public static final String ADMIN = "ADMIN";

    /** 관리자인가? (조회 API에서 보여줄 범위를 정할 때 사용, 막지는 않음) */
    public boolean isAdmin(String role) {
        return ADMIN.equals(role);
    }

    /**
     * @param userId 로그인한 사용자 ID (X-User-Id 헤더)
     * @param role   로그인한 사용자 역할 (X-User-Role 헤더)
     */
    public void requireAdmin(UUID userId, String role) {
        // 1) 누구인지 모름 → 401
        if (userId == null || role == null || role.isBlank()) {
            throw new BusinessException(
                    HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "로그인이 필요합니다.");
        }
        // 2) 누구인지는 알지만 관리자가 아님 → 403
        if (!ADMIN.equals(role)) {
            throw new BusinessException(
                    HttpStatus.FORBIDDEN, "FORBIDDEN", "관리자만 사용할 수 있는 기능입니다.");
        }
    }
}
