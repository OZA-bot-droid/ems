package com.ems.interaction.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatSendRequest {

    // 채팅 메시지 내용
    @NotBlank(message = "메시지를 입력해 주세요.")
    @Size(max = 1000, message = "메시지는 1000자 이하로 입력해야 합니다.")
    private String content;
}
