package com.ems.event.common;

import java.time.Instant;

/**
 * 팀 공통 오류 응답 (API 계약 및 공통 오류 응답 규격 2절)
 * {
 *   "success": false, "code": "EVENT_NOT_FOUND", "message": "행사를 찾을 수 없습니다.",
 *   "status": 404, "timestamp": "2026-10-28T05:30:00Z", "path": "/api/events/999", "traceId": null
 * }
 * - code   : 프론트가 분기할 때 쓰는 이름 (UPPER_SNAKE_CASE)
 * - message: 사용자에게 보여도 안전한 문구 (내부 예외·SQL 노출 금지)
 * - status : 실제 HTTP 상태와 같은 숫자
 * - path   : 외부에서 보이는 /api/... 주소 (쿼리 제외)
 * - traceId: 추적 ID. 아직 Gateway에 추적 기능이 없어서 null (가짜로 만들지 않음)
 */
public record ErrorResponse(
        boolean success,
        String code,
        String message,
        int status,
        Instant timestamp,
        String path,
        String traceId) {

    public static ErrorResponse of(int status, String code, String message, String path) {
        return new ErrorResponse(false, code, message, status, Instant.now(), path, null);
    }
}
