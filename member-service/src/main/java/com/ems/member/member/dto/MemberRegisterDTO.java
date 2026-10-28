package com.ems.member.member.dto;

import com.ems.member.member.domain.Member;
import com.ems.member.member.domain.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record MemberRegisterDTO(@Email
                                @NotBlank
                                @Size(max = 254)
                                String email,

                                @NotBlank
                                @Size(min = 8, max = 20)
                                @Pattern(
                                        regexp = "^(?=.*[A-Za-z])(?=.*\\\\d)(?=.*[!@#$%^&*])[A-Za-z\\\\d!@#$%^&*]+$",
                                        message = "비밀번호는 8~20자이며 영문, 숫자, 특수문자(!@#$%^&*)를 포함해야 합니다."
                                ) String password,

                                String name,
                                Role role) {

    public Member toEntity(String bCryptPassword) {

        return Member.builder()
                .email(this.email)
                .name(this.name)
                .passwordHash(bCryptPassword)
                .role(this.role)
                .build();
    }
}
