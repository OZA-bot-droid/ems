package com.ems.member.member.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NameDTO(@NotBlank @Size(max = 254) String name) {
}
