package com.ems.interaction.common.exception;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(boolean success, String code, String message, int status, Instant timestamp, String path,
                            String traceId) {
    public static ErrorResponse of(String code, String message, int status, String path, String traceId) {
        return new ErrorResponse(false, code, message, status, Instant.now(), path, traceId);
    }
}
