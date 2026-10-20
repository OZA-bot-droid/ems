package com.ems.event.common;

import java.time.Instant;

/** 공통 오류 응답 {code, message, timestamp} (docs/api-contract.md) */
public record ErrorResponse(String code, String message, Instant timestamp) {

    public static ErrorResponse of(String code, String message) {
        return new ErrorResponse(code, message, Instant.now());
    }
}
