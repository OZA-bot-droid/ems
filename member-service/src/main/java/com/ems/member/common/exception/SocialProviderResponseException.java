package com.ems.member.common.exception;

import com.ems.member.common.domain.BaseException;
import com.ems.member.common.domain.ErrorCode;

public class SocialProviderResponseException extends BaseException {
    public SocialProviderResponseException(String message) {
        super(message, ErrorCode.UPSTREAM_SERVICE_ERROR);
    }
}
