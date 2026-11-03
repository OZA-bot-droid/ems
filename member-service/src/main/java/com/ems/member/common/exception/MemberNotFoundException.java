package com.ems.member.common.exception;

import com.ems.member.common.domain.BaseException;
import com.ems.member.common.domain.ErrorCode;

// 조회시 해당 회원이 존재하지 않을 경우
public class MemberNotFoundException extends BaseException {
    public MemberNotFoundException(String message) {
        super(message, ErrorCode.MEMBER_NOT_FOUND);
    }
}
