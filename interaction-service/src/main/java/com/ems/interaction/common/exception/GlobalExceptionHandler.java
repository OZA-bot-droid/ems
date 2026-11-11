package com.ems.interaction.common.exception;

import com.ems.interaction.common.response.ApiPathUtils;
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
import org.springframework.dao.DataIntegrityViolationException;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);


    private String traceId() {
        String id = MDC.get("traceId");

        if (id == null || id.isBlank()) {
            id = MDC.get("trace_id");
        }

        return id == null || id.isBlank() ? null : id;
    }

    // 기존 공통 응답 생성 메서드
    private ResponseEntity<ErrorResponse> response(HttpStatusCode status, String code, String message, HttpServletRequest request) {
        String path = ApiPathUtils.externalPath(request);

        return ResponseEntity.status(status).body(ErrorResponse.of(code, message, status.value(), path, traceId()));
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


    // 존재하지 않는 API 경로 요청 시 404 처리
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> noResourceFound(NoResourceFoundException ex, HttpServletRequest request) {
        return response(ErrorCode.RESOURCE_NOT_FOUND, request);
    }

    // 중복 투표 UNIQUE 위반인 경우에만 409로 처리
    // DB 무결성 오류가 발생했을 때 실행
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> dataIntegrity(DataIntegrityViolationException ex, HttpServletRequest request) {
        Throwable cause = ex;

        // DB 예외 원인을 순서대로 확인
        while (cause != null) {

            // 동일 사용자·동일 투표 UNIQUE 제약 위반
            if (cause instanceof ConstraintViolationException dbEx && "uk_poll_vote_user".equals(dbEx.getConstraintName())) {

                return response(ErrorCode.ALREADY_VOTED, request);
            }

            cause = cause.getCause();
        }

        log.error("DB integrity violation", ex);

        return response(ErrorCode.INTERNAL_SERVER_ERROR, request);
    }
}