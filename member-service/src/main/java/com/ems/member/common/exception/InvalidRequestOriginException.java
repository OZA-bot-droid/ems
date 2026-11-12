package com.ems.member.common.exception;

import com.ems.member.common.domain.BaseException;
import com.ems.member.common.domain.ErrorCode;

public class InvalidRequestOriginException extends BaseException {
    public InvalidRequestOriginException() {
        super("허용되지 않은 요청 출처입니다.", ErrorCode.FORBIDDEN);
    }
}
