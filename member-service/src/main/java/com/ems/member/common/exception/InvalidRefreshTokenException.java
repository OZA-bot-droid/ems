package com.ems.member.common.exception;

import com.ems.member.common.domain.BaseException;
import com.ems.member.common.domain.ErrorCode;

// 유효하지 않는 refreshToken 예외
public class InvalidRefreshTokenException extends BaseException {
    public InvalidRefreshTokenException(String message) {
        super(message, ErrorCode.INVALID_REFRESH_TOKEN);
    }
}
