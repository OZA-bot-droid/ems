package com.ems.event.common;

import org.springframework.http.HttpStatus;

/** 오류 코드와 HTTP 상태를 함께 담는 예외. GlobalExceptionHandler가 ErrorResponse로 바꾼다 */
public class BusinessException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    public BusinessException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public HttpStatus getStatus() { return status; }
    public String getCode() { return code; }
}
