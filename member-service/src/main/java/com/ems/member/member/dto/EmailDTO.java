package com.ems.member.member.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EmailDTO(@NotBlank @Email @Size(max = 254) String email) {
}
