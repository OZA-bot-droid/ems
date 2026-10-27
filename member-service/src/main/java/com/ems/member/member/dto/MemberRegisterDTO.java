package com.ems.member.member.dto;

import com.ems.member.member.domain.Member;
import com.ems.member.member.domain.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
public class MemberRegisterDTO {

    private String email;
    private String password;
    private String name;
    private Role role;

    public Member toEntity(String bCryptPassword) {

        return Member.builder()
                .email(this.email)
                .name(this.name)
                .passwordHash(bCryptPassword)
                .role(this.role)
                .build();
    }
}
