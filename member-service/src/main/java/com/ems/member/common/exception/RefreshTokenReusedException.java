package com.ems.member.common.exception;

import com.ems.member.common.domain.BaseException;
import com.ems.member.common.domain.ErrorCode;

// Refresh Token Rotation 보안을 강화하기 위한 탐지용 예외
// Refresh Token 탈취 후 재사용 공격 방지
// 이미 한 번 사용해서 폐기된 Refresh Token을 다시 사용하는 상황을 탐지하기 위한 예외
public class RefreshTokenReusedException extends BaseException {
    public RefreshTokenReusedException(String message) {
        super(message, ErrorCode.REFRESH_TOKEN_REUSED);
    }
}
