package com.ems.interaction.common.exception;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private String path(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return uri.startsWith("/api/") ? uri : "/api" + uri;
    }

    private String traceId() {
        String id = MDC.get("traceId");

        if (id == null || id.isBlank()) {
            id = MDC.get("trace_id");
        }

        return id == null || id.isBlank() ? null : id;
    }

    // 기존 공통 응답 생성 메서드
    private ResponseEntity<ErrorResponse> response(HttpStatusCode status, String code, String message, HttpServletRequest request) {

        return ResponseEntity.status(status).body(ErrorResponse.of(code, message, status.value(), path(request), traceId()));
    }

    // ErrorCode를 사용하는 응답 생성 메서드
    private ResponseEntity<ErrorResponse> response(ErrorCode errorCode, HttpServletRequest request) {

        return response(errorCode.getStatus(), errorCode.name(), errorCode.getMessage(), request);
    }

    // 1. ApiException 처리
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> api(ApiException ex, HttpServletRequest request) {

        return response(ex.getStatus(), ex.getCode(), ex.getMessage(), request);
    }

    // 2. @Valid 검증 오류
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> validation(MethodArgumentNotValidException ex, HttpServletRequest request) {

        return response(ErrorCode.VALIDATION_ERROR, request);
    }

    // 3. 요청 형식 및 입력값 오류
    @ExceptionHandler({HttpMessageNotReadableException.class, MissingRequestHeaderException.class, MethodArgumentTypeMismatchException.class, IllegalArgumentException.class})
    public ResponseEntity<ErrorResponse> invalidRequest(Exception ex, HttpServletRequest request) {

        return response(ErrorCode.INVALID_REQUEST, request);
    }

    // 4. ResponseStatusException 처리
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> statusException(ResponseStatusException ex, HttpServletRequest request) {

        HttpStatusCode status = ex.getStatusCode();

        ErrorCode errorCode = switch (status.value()) {
            case 400 -> ErrorCode.INVALID_REQUEST;
            case 401 -> ErrorCode.UNAUTHORIZED;
            case 403 -> ErrorCode.FORBIDDEN;
            case 404 -> ErrorCode.RESOURCE_NOT_FOUND;
            case 409 -> ErrorCode.INVALID_STATUS_CHANGE;
            case 500 -> ErrorCode.INTERNAL_SERVER_ERROR;
            case 502 -> ErrorCode.UPSTREAM_SERVICE_ERROR;
            case 503 -> ErrorCode.SERVICE_UNAVAILABLE;
            case 504 -> ErrorCode.UPSTREAM_TIMEOUT;
            default -> null;
        };

        if (errorCode != null) {
            return response(errorCode, request);
        }

        // 등록하지 않은 상태 코드는 원래 HTTP 상태 유지
        return response(status, "HTTP_" + status.value(), "요청을 처리하지 못했습니다.", request);
    }

    // 5. 예상하지 못한 내부 오류
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> unexpected(Exception ex, HttpServletRequest request) {

        log.error("Unhandled request failure: {}", request.getRequestURI(), ex);

        return response(ErrorCode.INTERNAL_SERVER_ERROR, request);
    }
}