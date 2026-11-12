package com.ems.member.common.exception;

import com.ems.member.common.domain.BaseException;
import com.ems.member.common.domain.ErrorCode;

public class LoginRateLimitException extends BaseException {
    public LoginRateLimitException(String message) {
        super(message, ErrorCode.LOGIN_RATE_LIMITED);
    }
}
