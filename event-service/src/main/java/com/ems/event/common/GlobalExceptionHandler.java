package com.ems.event.common;

import jakarta.servlet.http.HttpServletRequest;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

/**
 * 모든 오류를 팀 공통 형식(ErrorResponse 7칸)으로 바꿔서 응답한다.
 * 행사·세션의 BusinessException 뿐 아니라 참가 신청 쪽 ResponseStatusException도 여기서 같은 모양으로 변환.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** 우리가 직접 던진 규칙 위반 (EVENT_NOT_FOUND, EVENT_OWNER_REQUIRED, INVALID_PERIOD ...) */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(BusinessException e, HttpServletRequest request) {
        return respond(e.getStatus(), e.getCode(), e.getMessage(), request);
    }

    /** @Valid 검증 실패 (예: title 비어 있음, capacity 0) → 400 VALIDATION_ERROR */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException e, HttpServletRequest request) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return respond(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message, request);
    }

    /** JSON 형식 오류, 없는 status 값, 잘못된 날짜 형식 → 400 INVALID_REQUEST */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleUnreadable(HttpMessageNotReadableException e, HttpServletRequest request) {
        return respond(HttpStatus.BAD_REQUEST, "INVALID_REQUEST",
                "요청 본문을 읽을 수 없습니다. JSON 형식과 값을 확인하세요.", request);
    }

    /** 경로/쿼리 값 형식 오류 (예: eventId가 숫자가 아님) → 400 INVALID_REQUEST */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException e, HttpServletRequest request) {
        return respond(HttpStatus.BAD_REQUEST, "INVALID_REQUEST",
                e.getName() + " 값의 형식이 올바르지 않습니다.", request);
    }

    /**
     * 참가 신청 쪽에서 쓰는 ResponseStatusException → 상태별 기본 code + 깨끗한 메시지
     * (전에는 code=REQUEST_ERROR, message="409 CONFLICT \"...\"" 로 나갔음)
     * 신청 쪽이 BusinessException + 세부 code(ALREADY_REGISTERED 등)로 바뀌면 그 code가 그대로 나간다.
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatus(ResponseStatusException e, HttpServletRequest request) {
        String message = e.getReason() != null ? e.getReason() : defaultMessage(e.getStatusCode());
        return respond(e.getStatusCode(), defaultCode(e.getStatusCode()), message, request);
    }

    /** DB 제약조건 위반(중복 등)이 서비스에서 처리되지 않고 올라온 경우 → 500 대신 409 */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrity(DataIntegrityViolationException e, HttpServletRequest request) {
        log.warn("DB 제약조건 위반: {}", e.getMostSpecificCause().getMessage()); // 원인은 로그에만
        return respond(HttpStatus.CONFLICT, "DUPLICATE_RESOURCE",
                "요청이 기존 데이터와 충돌합니다.", request);
    }

    /** 그 밖의 모든 오류 */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnknown(Exception e, HttpServletRequest request) {
        // 없는 주소(404), 허용되지 않은 메서드(405) 등 Spring 기본 오류는 원래 상태 코드를 유지
        if (e instanceof org.springframework.web.ErrorResponse springError) {
            HttpStatusCode status = springError.getStatusCode();
            return respond(status, defaultCode(status), defaultMessage(status), request);
        }
        // 예상 못 한 오류: 원인은 서버 로그에 남기고, 응답에는 내부 정보(스택·SQL)를 노출하지 않음
        log.error("처리되지 않은 오류: {} {}", request.getMethod(), request.getRequestURI(), e);
        return respond(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR",
                "서버 오류가 발생했습니다.", request);
    }

    // ===== 도우미 =====

    private ResponseEntity<ErrorResponse> respond(HttpStatusCode status, String code, String message,
                                                  HttpServletRequest request) {
        return ResponseEntity.status(status)
                .body(ErrorResponse.of(status.value(), code, message, externalPath(request)));
    }

    /**
     * 외부에서 보이는 주소로 바꾼다.
     * Gateway가 "/api"를 떼고(StripPrefix=1) 넘겨주므로 서비스는 "/events/999"만 안다 → "/api/events/999"
     * getRequestURI()는 쿼리(?page=1)를 포함하지 않으므로 개인정보가 섞이지 않는다.
     */
    static String externalPath(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return uri.startsWith("/api/") ? uri : "/api" + uri;
    }

    /** 규격 3절 "공통 HTTP 상태 기준"의 기본 code */
    static String defaultCode(HttpStatusCode status) {
        return switch (status.value()) {
            case 400 -> "INVALID_REQUEST";
            case 401 -> "UNAUTHORIZED";
            case 403 -> "FORBIDDEN";
            case 404 -> "RESOURCE_NOT_FOUND";
            case 409 -> "DUPLICATE_RESOURCE";
            case 502 -> "UPSTREAM_SERVICE_ERROR";
            case 503 -> "SERVICE_UNAVAILABLE";
            case 504 -> "UPSTREAM_TIMEOUT";
            default -> status.is5xxServerError() ? "INTERNAL_SERVER_ERROR" : "INVALID_REQUEST";
        };
    }

    private static String defaultMessage(HttpStatusCode status) {
        return switch (status.value()) {
            case 404 -> "요청한 대상을 찾을 수 없습니다.";
            case 405 -> "허용되지 않은 요청 방식입니다.";
            default -> status.is5xxServerError() ? "서버 오류가 발생했습니다." : "요청을 처리할 수 없습니다.";
        };
    }
}
