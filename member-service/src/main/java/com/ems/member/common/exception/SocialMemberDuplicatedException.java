package com.ems.member.common.exception;

import com.ems.member.common.domain.BaseException;
import com.ems.member.common.domain.ErrorCode;

// 소셜 회원가입인데 이미 가입되어 있을 경우
public class SocialMemberDuplicatedException extends BaseException {
    public SocialMemberDuplicatedException(String message) {
        super(message, ErrorCode.SOCIAL_MEMBER_DUPLICATED);
    }
}
