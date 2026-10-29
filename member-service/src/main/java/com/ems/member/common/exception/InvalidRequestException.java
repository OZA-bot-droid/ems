package com.ems.member.common.exception;

import com.ems.member.common.domain.BaseException;
import com.ems.member.common.domain.ErrorCode;

// 요청 값의 조합이나 요청 자체가 논리적으로 잘못된 경우
public class InvalidRequestException extends BaseException {
    public InvalidRequestException(String message) {
        super(message, ErrorCode.INVALID_REQUEST);
    }
}
