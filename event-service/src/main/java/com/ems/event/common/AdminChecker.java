package com.ems.event.common;

import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * 관리자(ADMIN)만 할 수 있는 요청인지 검사한다.
 *
 * 흐름: 로그인 → Member Service가 JWT 발급(role 포함)
 *       → Gateway가 JWT를 검증하고 X-User-Id, X-User-Role 헤더를 붙여서 전달
 *       → Controller가 헤더를 받아 이 클래스로 검사
 */
@Component
public class AdminChecker {

    public static final String ADMIN = "ADMIN";

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
