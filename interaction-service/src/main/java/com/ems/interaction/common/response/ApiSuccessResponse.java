package com.ems.interaction.common.response;

import java.time.Instant;

//공통 성공 응답 DTO
public record ApiSuccessResponse<T>(boolean success, T data, String message, int status, Instant timestamp, String path,
                                    String traceId) {
    public static <T> ApiSuccessResponse<T> of(T data, String message, int status, String path, String traceId) {
        return new ApiSuccessResponse<>(true, data, message, status, Instant.now(), path, traceId);
    }
}
