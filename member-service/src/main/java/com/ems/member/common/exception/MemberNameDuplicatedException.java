package com.ems.member.common.exception;

import com.ems.member.common.domain.BaseException;
import com.ems.member.common.domain.ErrorCode;

public class MemberNameDuplicatedException extends BaseException {
    public MemberNameDuplicatedException(String message) {
        super(message, ErrorCode.MEMBER_NAME_DUPLICATED);
    }
}
