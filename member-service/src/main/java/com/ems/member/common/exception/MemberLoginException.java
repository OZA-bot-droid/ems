package com.ems.member.common.exception;

import com.ems.member.common.domain.BaseException;
import com.ems.member.common.domain.ErrorCode;

// 일반 로그인 예외
public class MemberLoginException extends BaseException {
    public MemberLoginException(String message) {
        super(message, ErrorCode.INVALID_CREDENTIALS);
    }
}
