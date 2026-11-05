package com.ems.member.common.dto;

import java.time.Instant;

public record APISuccessResponse<T>(boolean success,
                                    T data,
                                    String message,
                                    int status,
                                    Instant timestamp,
                                    String path,
                                    String traceId) {

    public APISuccessResponse {
        if(!path.startsWith("/api/")) {
            path = "/api" + path;
        }
    }
}
