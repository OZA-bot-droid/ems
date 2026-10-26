package com.ems.event.common;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;


@Component
public class AdminChecker {

    public static final String ADMIN = "ADMIN";

//  관리자인지만 체크
    public boolean isAdmin(String role) {
        return ADMIN.equals(role);
    }

//  role별 권한 판정
    public void requireAdmin(Long userId, String role) {
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
