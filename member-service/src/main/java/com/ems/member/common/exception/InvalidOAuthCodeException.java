package com.ems.member.common.exception;

import com.ems.member.common.domain.BaseException;
import com.ems.member.common.domain.ErrorCode;

public class InvalidOAuthCodeException extends BaseException {
    public InvalidOAuthCodeException(String message) {
        super(message, ErrorCode.INVALID_OAUTH_CODE);
    }
}
