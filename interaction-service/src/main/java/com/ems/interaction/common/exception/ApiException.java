package com.ems.interaction.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    // 기존 코드와의 호환성
    public ApiException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    // ErrorCode 사용
    public ApiException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.status = errorCode.getStatus();
        this.code = errorCode.name();
    }
}