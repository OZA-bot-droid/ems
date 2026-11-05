package com.ems.member.common.exception;

import com.ems.member.common.domain.BaseException;
import com.ems.member.common.domain.ErrorCode;

public class InvalidPasswordResetTokenException extends BaseException {
    public InvalidPasswordResetTokenException(String message) {
        super(message, ErrorCode.INVALID_PASSWORD_RESET_TOKEN);
    }
}
