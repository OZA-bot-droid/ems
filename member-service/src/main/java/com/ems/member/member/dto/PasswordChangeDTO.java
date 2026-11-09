package com.ems.member.member.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PasswordChangeDTO(@NotBlank(message = "기존 비밀번호를 입력해주세요.")
                                String currentPassword,
                                @NotBlank(message = "새 비밀번호를 입력해주세요.")
                                @Size(min = 8, max = 20)
                                @Pattern(
                                        regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[!@#$%^&*])[A-Za-z\\d!@#$%^&*]+$",
                                        message = "비밀번호는 8~20자이며 영문, 숫자, 특수문자(!@#$%^&*)를 포함해야 합니다."
                                )
                                String newPassword) {
}
