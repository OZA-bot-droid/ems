package com.ems.member.common.exception;

import com.ems.member.common.domain.BaseException;
import com.ems.member.common.domain.ErrorCode;

public class InvalidRequestException extends BaseException {
    public InvalidRequestException(String message) {
        super(message, ErrorCode.INVALID_REQUEST);
    }
}
