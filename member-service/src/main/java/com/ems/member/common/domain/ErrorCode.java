package com.ems.member.common.domain;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // 400 Bad Request
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST),
    INVALID_REQUEST(HttpStatus.BAD_REQUEST),
    INVALID_ROLE(HttpStatus.BAD_REQUEST),

    // 401 Unauthorized
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED),
    INVALID_REFRESH_TOKEN(HttpStatus.UNAUTHORIZED),
    REFRESH_TOKEN_REUSED(HttpStatus.UNAUTHORIZED),
    SOCIAL_MEMBER_NOT_FOUND(HttpStatus.UNAUTHORIZED),

    // 403 Forbidden
    FORBIDDEN(HttpStatus.FORBIDDEN),

    // 404 Not Found
    MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND),

    // 409 Conflict
    MEMBER_EMAIL_DUPLICATED(HttpStatus.CONFLICT),
    SOCIAL_MEMBER_DUPLICATED(HttpStatus.CONFLICT),

    // 500 Interval Server Error
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR),

    // 502 Bad Gateway
    UPSTREAM_SERVICE_ERROR(HttpStatus.BAD_GATEWAY),

    // 503 Service Unavailable
    SERVICE_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE),

    // 504 Gateway Timeout
    UPSTREAM_TIMEOUT(HttpStatus.GATEWAY_TIMEOUT);

    private final HttpStatus status;

    ErrorCode(HttpStatus status) {
        this.status = status;
    }
}
