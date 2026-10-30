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

// 여러 Controller에서 발생하는 예외를 한 곳에서 공통 처리할 수 있게 해주는 어노테이션
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

    // @ExceptionHandler : 특정 예외가 발생했을 때 어떤 메서드가 그 예외를 처리할지 지정하는 어노테이션
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

        // 예외 종류 받기
        Throwable cause = e.getCause();

        // 내부 cause가 InvalidFormatException인지 확인
        // InvalidFormatException : Jackson이 JSON 값을 자바 타입으로 변환하지 못했을 때 발생시키는 예외
        if(cause instanceof InvalidFormatException invalidFormatException) {

            // Class : 클래스 자체에 대한 정보를 담는 객체
            // getTargetType : 원래 어떤 Java 타입으로 변환하려고 했는지를 알려줌
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
    // controller에서 @Valid로 dto의 validation 조건을 통과하지 못할 경우 발생하는 예외
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<APIErrorResponse> handleValidationException(MethodArgumentNotValidException e, HttpServletRequest request) {

        ErrorCode errorCode = ErrorCode.VALIDATION_ERROR;

        // @Valid로 검증시 실패할 경우 여기서 message를 가져옴
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
