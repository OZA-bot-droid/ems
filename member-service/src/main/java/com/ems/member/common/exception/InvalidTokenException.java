package com.ems.member.common.exception;

import com.ems.member.common.domain.BaseException;
import com.ems.member.common.domain.ErrorCode;

// Access Token의 서명, 만료, 형식 등이 잘못된 경우
public class InvalidTokenException extends BaseException {
    public InvalidTokenException(String message) {
        super(message, ErrorCode.INVALID_TOKEN);
    }
}
