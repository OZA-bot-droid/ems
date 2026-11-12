package com.ems.member.common.domain;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // 400 Bad Request
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST),
    INVALID_ROLE(HttpStatus.BAD_REQUEST),
    INVALID_REQUEST(HttpStatus.BAD_REQUEST),
    INVALID_OAUTH_CODE(HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD_RESET_TOKEN(HttpStatus.BAD_REQUEST),
    INVALID_EMAIL_VERIFICATION(HttpStatus.BAD_REQUEST),

    // 401 Unauthorized
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED),
    INVALID_REFRESH_TOKEN(HttpStatus.UNAUTHORIZED),
    REFRESH_TOKEN_REUSED(HttpStatus.UNAUTHORIZED),

    // 403 Forbidden
    FORBIDDEN(HttpStatus.FORBIDDEN),

    // 404 Not Found
    MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND),

    // 409 Conflict
    MEMBER_EMAIL_DUPLICATED(HttpStatus.CONFLICT),

    // 429 Too Many Requests
    LOGIN_RATE_LIMITED(HttpStatus.TOO_MANY_REQUESTS),

    // 500 Interval Server Error
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR),

    // 502 Bad Gateway
    UPSTREAM_SERVICE_ERROR(HttpStatus.BAD_GATEWAY);

    private final HttpStatus status;

    ErrorCode(HttpStatus status) {
        this.status = status;
    }
}
