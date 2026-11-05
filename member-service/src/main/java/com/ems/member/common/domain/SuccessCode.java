package com.ems.member.common.domain;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum SuccessCode {

    REQUEST_SUCCESS(HttpStatus.OK, "요청 성공"),
    MEMBER_REGISTERED(HttpStatus.CREATED, "회원가입 성공"),
    LOGIN_SUCCESS(HttpStatus.OK, "로그인 성공"),
    TOKEN_REISSUED(HttpStatus.OK, "토큰 재발급 성공"),
    LOGOUT_SUCCESS(HttpStatus.OK, "로그아웃 성공"),
    PASSWORD_RESET_REQUESTED(HttpStatus.OK, "해당 계정으로 이메일이 전송되었습니다."),
    PASSWORD_RESET_SUCCESS(HttpStatus.OK, "비밀번호가 변경되었습니다.");

    private final HttpStatus httpStatus;
    private final String message;

    SuccessCode(HttpStatus httpStatus, String message) {
        this.httpStatus = httpStatus;
        this.message = message;
    }
}
