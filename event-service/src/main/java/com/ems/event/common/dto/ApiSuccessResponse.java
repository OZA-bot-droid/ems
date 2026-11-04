package com.ems.event.common.dto;

import com.ems.event.common.web.ApiPath;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import org.springframework.http.HttpStatus;

/**
 * 팀 공통 성공 응답 (docs/api-response-standard.md 2절)
 * {
 *   "success": true, "data": { ... }, "message": "행사 조회 성공",
 *   "status": 200, "timestamp": "2026-11-04T01:00:00Z", "path": "/api/events/7", "traceId": null
 * }
 * - data   : API별 DTO·목록·페이지. 실패 응답에는 이 상자 대신 ErrorResponse를 쓴다
 * - message: 사람이 읽는 짧은 설명 (프론트는 분기에 쓰지 않음)
 * - status : 실제 HTTP 상태와 같은 숫자 (200, 201)
 * - path   : 외부 /api/... 주소 (쿼리 제외)
 * - traceId: 아직 Gateway에 추적 기능이 없어서 null (가짜로 만들지 않음)
 * - 204(삭제)는 이 상자를 쓰지 않고 본문 없이 보낸다
 * 규격 5.2 권장대로 자동 래핑(ResponseBodyAdvice) 대신 Controller에서 명시적으로 만든다.
 */
public record ApiSuccessResponse<T>(
        boolean success,
        T data,
        String message,
        int status,
        Instant timestamp,
        String path,
        String traceId) {

    /** 200 OK: 조회·수정·처리 완료 */
    public static <T> ApiSuccessResponse<T> ok(T data, String message, HttpServletRequest request) {
        return of(HttpStatus.OK, data, message, request);
    }

    /** 201 Created: 생성 완료 (Location 헤더는 Controller에서 ResponseEntity.created(...)로) */
    public static <T> ApiSuccessResponse<T> created(T data, String message, HttpServletRequest request) {
        return of(HttpStatus.CREATED, data, message, request);
    }

    private static <T> ApiSuccessResponse<T> of(HttpStatus status, T data, String message,
                                                HttpServletRequest request) {
        return new ApiSuccessResponse<>(true, data, message, status.value(), Instant.now(),
                ApiPath.external(request), null);
    }
}
