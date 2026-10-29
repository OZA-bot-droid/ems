package com.ems.member.common.exception;

import com.ems.member.common.domain.BaseException;
import com.ems.member.common.domain.ErrorCode;

public class UnsupportedSocialProviderException extends BaseException {
    public UnsupportedSocialProviderException(String message) {
        super(message, ErrorCode.INTERNAL_SERVER_ERROR);
    }
}
