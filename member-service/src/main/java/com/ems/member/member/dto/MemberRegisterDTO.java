package com.ems.member.member.dto;

import com.ems.member.member.domain.Member;
import com.ems.member.member.domain.Role;
import jakarta.validation.constraints.*;

public record MemberRegisterDTO(@Email(message = "올바른 이메일 형식이 아닙니다.")
                                @NotBlank(message = "이메일을 입력해주세요.")
                                @Size(max = 254, message = "이메일은 254자를 초과할 수 없습니다.")
                                String email,

                                @NotBlank(message = "비밀번호를 입력해주세요.")
                                @Size(min = 8, max = 20)
                                @Pattern(
                                        regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[!@#$%^&*])[A-Za-z\\d!@#$%^&*]+$",
                                        message = "비밀번호는 8~20자이며 영문, 숫자, 특수문자(!@#$%^&*)를 포함해야 합니다."
                                ) String password,

                                @NotBlank(message = "이름을 1글자 이상 입력해주세요.")
                                String name,

                                @NotBlank(message = "회원 유형을 선택해주세요.")
                                Role role) {

    // @NotBlank : null, 빈 문자열, 공백만 있는 문자열 금지
    // @NotNull : null인지만 검사

    // regexp : 문자열 허용 정규식

    public Member toEntity(String bCryptPassword) {

        return Member.builder()
                .email(this.email)
                .name(this.name)
                .passwordHash(bCryptPassword)
                .role(this.role)
                .provider("local")
                .build();
    }
}
