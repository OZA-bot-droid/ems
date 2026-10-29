package com.ems.member.common.exception;

import com.ems.member.common.domain.BaseException;
import com.ems.member.common.domain.ErrorCode;

// 소셜 로그인했는데 가입된 회원이 아닐 경우
public class SocialMemberNotFoundException extends BaseException {
    public SocialMemberNotFoundException(String message) {
        super(message, ErrorCode.SOCIAL_MEMBER_NOT_FOUND);
    }
}
