package com.ems.member.common.exception;

import com.ems.member.common.domain.BaseException;
import com.ems.member.common.domain.ErrorCode;

// 인증 정보 자체가 없는 경우
public class UnauthorizedException extends BaseException {
    public UnauthorizedException(String message) {
        super(message, ErrorCode.UNAUTHORIZED);
    }
}
