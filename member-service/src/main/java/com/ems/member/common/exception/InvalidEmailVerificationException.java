package com.ems.member.common.exception;

import com.ems.member.common.domain.BaseException;
import com.ems.member.common.domain.ErrorCode;

public class InvalidEmailVerificationException extends BaseException {
    public InvalidEmailVerificationException(String message) {
        super(message, ErrorCode.INVALID_EMAIL_VERIFICATION);
    }
}
