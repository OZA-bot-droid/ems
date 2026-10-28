package com.ems.interaction.common.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
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
        // API Gateway에서 X-Forwarded-Prefix=/api 를 전달하는 환경은 그 값을 활용합니다.
        // 직접 서비스에 접근하는 개발 환경에서도 외부 공개 경로 /api/... 로 표기합니다.
        String uri = request.getRequestURI();
        String prefix = request.getHeader("X-Forwarded-Prefix");
        if (prefix != null && prefix.matches("/api/?")) {
            return uri.startsWith("/api/") ? uri : "/api" + uri;
        }
        return uri.startsWith("/api/") ? uri : "/api" + uri;
    }

    private String traceId() {
        String id = MDC.get("traceId");
        if (id == null || id.isBlank()) id = MDC.get("trace_id");
        return id == null || id.isBlank() ? null : id;
    }

    private ResponseEntity<ErrorResponse> response(HttpStatus status, String code,
                                                   String message, HttpServletRequest request) {
        return ResponseEntity.status(status)
                .body(ErrorResponse.of(code, message, status.value(), path(request), traceId()));
    }

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> api(ApiException ex, HttpServletRequest request) {
        return response(ex.getStatus(), ex.getCode(), ex.getMessage(), request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> validation(MethodArgumentNotValidException ex,
                                                     HttpServletRequest request) {
        return response(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                "요청 입력값을 확인해 주세요.", request);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MissingRequestHeaderException.class,
            MethodArgumentTypeMismatchException.class, IllegalArgumentException.class})
    public ResponseEntity<ErrorResponse> invalidRequest(Exception ex, HttpServletRequest request) {
        return response(HttpStatus.BAD_REQUEST, "INVALID_REQUEST",
                "요청 형식이나 입력값이 올바르지 않습니다.", request);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> statusException(ResponseStatusException ex,
                                                          HttpServletRequest request) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        if (status == null) status = HttpStatus.INTERNAL_SERVER_ERROR;
        String code = switch (status) {
            case BAD_REQUEST -> "INVALID_REQUEST";
            case UNAUTHORIZED -> "UNAUTHORIZED";
            case FORBIDDEN -> "FORBIDDEN";
            case NOT_FOUND -> "RESOURCE_NOT_FOUND";
            case CONFLICT -> "INVALID_STATUS_CHANGE";
            default -> "INTERNAL_SERVER_ERROR";
        };
        // ResponseStatusException 메시지에는 내부 정보가 있을 수 있으므로 노출하지 않습니다.
        String message = switch (status) {
            case BAD_REQUEST -> "요청 정보가 올바르지 않습니다.";
            case UNAUTHORIZED -> "인증이 필요합니다.";
            case FORBIDDEN -> "요청 권한이 없습니다.";
            case NOT_FOUND -> "요청한 리소스를 찾을 수 없습니다.";
            case CONFLICT -> "현재 상태에서는 요청을 처리할 수 없습니다.";
            default -> "요청을 처리하지 못했습니다.";
        };
        return response(status, code, message, request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> unexpected(Exception ex, HttpServletRequest request) {
        log.error("Unhandled request failure: {}", request.getRequestURI(), ex);
        return response(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR",
                "서버 오류가 발생했습니다.", request);
    }
}
