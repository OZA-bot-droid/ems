package com.ems.member.member.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Locale;
import java.util.UUID;

public record MemberLoginDTO(@Email(message = "올바른 이메일 형식이 아닙니다.")
                             @NotBlank(message = "이메일을 입력해주세요.")
                             String email,
                             @NotBlank(message = "비밀번호를 입력해주세요.")
                             String password,
                             @NotNull(message = "clientId가 필요합니다.")
                             UUID clientId) {

    public MemberLoginDTO {
        if(email != null) {
            email = email.trim().toLowerCase(Locale.ROOT);
        }
    }
}
