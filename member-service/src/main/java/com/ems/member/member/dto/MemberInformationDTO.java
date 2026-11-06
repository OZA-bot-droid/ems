package com.ems.member.member.dto;

import com.ems.member.member.domain.Role;

public record MemberInformationDTO(String email, String name, Role role) {
}
