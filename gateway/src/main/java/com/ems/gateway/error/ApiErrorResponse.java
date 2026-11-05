package com.ems.gateway.error;

import java.time.Instant;

public record ApiErrorResponse(
        boolean success,
        String code,
        String message,
        int status,
        Instant timestamp,
        String path,
        String traceId
) { }
