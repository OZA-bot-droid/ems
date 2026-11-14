package com.ems.interaction.chat.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Entity
@Table(name = "chat_message")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 채팅방을 구분하는 세션 ID
    @Column(name = "session_id", nullable = false)
    private Long sessionId;

    // 메시지를 작성한 사용자 ID
    @Column(name = "member_id", nullable = false)
    private Long memberId;

    // 메시지 내용
    @Column(name = "content", nullable = false, length = 1000)
    private String content;

    // 메시지 생성 시각
    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    // 채팅 메시지 생성
    public ChatMessage(Long sessionId, Long memberId, String content) {
        this.sessionId = sessionId;
        this.memberId = memberId;
        this.content = content;
    }
}
