package com.ems.member.common.exception;

import com.ems.member.common.domain.BaseException;
import com.ems.member.common.domain.ErrorCode;

// 회원 가입할 때 유효하지 않은 role 값
public class InvalidRoleException extends BaseException {
    public InvalidRoleException(String message) {
        super(message, ErrorCode.INVALID_ROLE);
    }
}
