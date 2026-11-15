package com.ems.interaction.chat.controller;

import com.ems.interaction.chat.dto.ChatSendRequest;
import com.ems.interaction.chat.service.ChatService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    // 채팅 메시지 저장 및 실시간 방송을 담당하는 서비스
    private final ChatService chatService;

    /**
     * 실시간 채팅 메시지 수신
     * <p>
     * STOMP SEND:
     * /app/sessions/{sessionId}/chat.send
     * <p>
     * 실제 메시지 저장 및 브로드캐스트는 ChatService에서 처리한다.
     */
    @MessageMapping("/sessions/{sessionId}/chat.send")
    public void sendChat(@DestinationVariable Long sessionId, @Valid @Payload ChatSendRequest request, Principal principal) {

        // 인증되지 않은 사용자 차단
        if (principal == null) {
            throw new IllegalArgumentException("채팅 전송 실패: 인증되지 않은 사용자입니다.");
        }

        // STOMP CONNECT에서 인증한 사용자 ID 가져오기
        Long memberId;

        try {
            memberId = Long.valueOf(principal.getName());

            if (memberId <= 0) {
                throw new NumberFormatException();
            }

        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("채팅 전송 실패: 사용자 ID가 올바르지 않습니다.");
        }

        // Controller 메시지 수신 여부 확인용 로그
        log.info("[CHAT] 메시지 수신 - sessionId: {}, memberId: {}", sessionId, memberId);

        // 채팅 저장 및 실시간 방송
        chatService.sendMessage(sessionId, memberId, request);
    }
}
