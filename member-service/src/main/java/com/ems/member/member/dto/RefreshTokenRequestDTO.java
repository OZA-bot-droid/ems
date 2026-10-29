package com.ems.member.member.dto;

import jakarta.validation.constraints.NotBlank;

public record RefreshTokenRequestDTO(@NotBlank(message = "clientId가 필요합니다.") String clientId) {
}
