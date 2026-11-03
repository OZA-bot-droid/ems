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

    // compact constructor
    // 정규화
    // 생성 시점에 들어온 값을 검증 혹은 수정하고 싶을 때 사용
    public APIErrorResponse {
        path = "/api" + path;
    }
}
