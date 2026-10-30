package com.ems.member.common.handler;

import com.ems.member.common.domain.BaseException;
import com.ems.member.common.domain.ErrorCode;
import com.ems.member.common.dto.APIErrorResponse;
import com.ems.member.member.domain.Role;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
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

    // Spring은 더 구체적으로 일치하는 Exception Handler를 먼저 선택
    // 사용자 정의 예외가 발생할 경우
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

    // JSON or enum 변환 실패 -> role문제 포함
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<APIErrorResponse> handleHttpMessageNotReadableException(HttpMessageNotReadableException e, HttpServletRequest request) {

        // Role enum 변환 실패 => HttpMessageNotReadableException
        ErrorCode errorCode = ErrorCode.INVALID_REQUEST;
        String message = "요청 형식이 올바르지 않습니다.";

        Throwable cause = e.getCause();

        // 내부 cause가 InvalidFormatException
        if(cause instanceof InvalidFormatException invalidFormatException) {

            Class<?> targetType = invalidFormatException.getTargetType();

            if(targetType == Role.class) {
                errorCode = ErrorCode.INVALID_ROLE;
                message = "유효하지 않는 role입니다.";
            }
        }

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

    // DTO validation 실패 -> 필드가 조건에 맞지 않음
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<APIErrorResponse> handleValidationException(MethodArgumentNotValidException e, HttpServletRequest request) {

        ErrorCode errorCode = ErrorCode.VALIDATION_ERROR;

        String message = e.getBindingResult()
                .getFieldErrors()
                .stream()
                .findFirst()
                .map(FieldError::getDefaultMessage)
                .orElse("요청 값이 올바르지 않습니다.");

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

    // 그외 예외 -> 500
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
