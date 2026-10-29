package com.ems.member.common.handler;

import com.ems.member.common.domain.BaseException;
import com.ems.member.common.domain.ErrorCode;
import com.ems.member.common.dto.APIErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;

@RestControllerAdvice
public class GlobalExceptionHandler {

    /*
    {
        "success": false,
        "code": "EVENT_NOT_FOUND",
        "message": "행사를 찾을 수 없습니다.",
        "status": 404,
        "timestamp": "2026-10-28T05:30:00.000Z",
        "path": "/api/events/999",
        "traceId": "a83f0d219bc74e0a"
    }
    */

    // 회원가입 실패, 이메일 중복 예외
    // Spring은 더 구체적으로 일치하는 BaseException Handler를 먼저 선택
    @ExceptionHandler(BaseException.class)
    public ResponseEntity<APIErrorResponse> handleMemberSignupException(BaseException e, HttpServletRequest request) {

        ErrorCode errorCode = e.getErrorCode();

        APIErrorResponse response = new APIErrorResponse(
                false,
                errorCode,
                e.getMessage(),
                errorCode.getStatus().value(),
                Instant.now(),
                request.getRequestURI(),
                null
        );

        return new ResponseEntity<>(response, errorCode.getStatus());
    }

    // 아직 dto에 @Valid 추가 안함
    /*
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<APIErrorResponse> handleValidationException(MethodArgumentNotValidException e, HttpServletRequest request) {

        String message = e.getBindingResult()
                .getFieldErrors()
                .stream()
                .findFirst()
                .map(FieldError::getDefaultMessage)
                .orElse("요청 값이 올바르지 않습니다.");

        ErrorCode errorCode = ErrorCode.VALIDATION_ERROR;

        APIErrorResponse response = new APIErrorResponse(
                false,
                errorCode,
                message,
                errorCode.getStatus().value(),
                Instant.now(),
                request.getRequestURI(),
                null
        );

        return new ResponseEntity<>(response, errorCode.getStatus());
    }
    */

    @ExceptionHandler(Exception.class)
    public ResponseEntity<APIErrorResponse> handleException(Exception e, HttpServletRequest request) {

        ErrorCode errorCode = ErrorCode.INTERNAL_SERVER_ERROR;

        APIErrorResponse response = new APIErrorResponse(
                false,
                errorCode,
                "서버 내부 오류가 발생했습니다.",
                errorCode.getStatus().value(),
                Instant.now(),
                request.getRequestURI(),
                null
        );

        return new ResponseEntity<>(response, errorCode.getStatus());
    }
}
