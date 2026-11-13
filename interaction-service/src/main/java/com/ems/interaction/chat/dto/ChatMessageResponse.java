package com.ems.interaction.chat.dto;

import com.ems.interaction.chat.domain.ChatMessage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageResponse {

    // 채팅 메시지 ID
    private Long id;

    // 채팅방이 속한 세션 ID
    private Long sessionId;

    // 채팅 메시지 작성자 ID
    private Long memberId;

    // 채팅 메시지 내용
    private String content;

    // 채팅 메시지 생성 시각
    private OffsetDateTime createdAt;

    // Entity -> DTO 변환
    public static ChatMessageResponse from(ChatMessage message) {

        return ChatMessageResponse.builder().id(message.getId()).sessionId(message.getSessionId()).memberId(message.getMemberId()).content(message.getContent()).createdAt(message.getCreatedAt()).build();
    }
}
