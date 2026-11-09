package com.ems.member.member.dto;

import com.ems.member.member.domain.Member;
import com.ems.member.member.domain.Role;

public record MemberInformationDTO(String email, String name, Role role, boolean status) {
    public MemberInformationDTO(Member member) {
        this(
                member.getEmail(),
                member.getName(),
                member.getRole(),
                member.getProvider().equalsIgnoreCase("LOCAL")
        );
    }
}
