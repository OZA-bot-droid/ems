package com.ems.member.common.dto;

import com.ems.member.common.domain.ErrorCode;

import java.time.Instant;

public record APIErrorResponse(boolean success,
                               ErrorCode code,
                               String message,
                               int status,
                               Instant timestamp,
                               String path,
                               String traceId) {
}
