package com.ems.member.common.exception;

import com.ems.member.common.domain.BaseException;
import com.ems.member.common.domain.ErrorCode;

// 회원가입 실패, 이메일 중복 예외
public class MemberSignupException extends BaseException {
    public MemberSignupException(String message) {
        super(message, ErrorCode.MEMBER_EMAIL_DUPLICATED);
    }
}
