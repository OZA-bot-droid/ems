package com.ems.member.member.dto;

import com.ems.member.common.domain.SuccessCode;

public record MessageResponseDTO<T>(T data, SuccessCode successCode) {
}
