package com.ems.interaction.chat.controller;

import com.ems.interaction.chat.dto.ChatMessageResponse;
import com.ems.interaction.chat.service.ChatService;

import com.ems.interaction.common.response.ApiResponseBuilder;
import jakarta.servlet.http.HttpServletRequest;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/interactions/sessions")
public class ChatController {

    // 채팅 서비스
    private final ChatService chatService;

    // 기존 프로젝트의 ApiResponseBuilder 사용
    private final ApiResponseBuilder apiResponseBuilder;

    /**
     * 세션 채팅방의 최근 메시지 조회
     * <p>
     * 세션 참가 권한을 검증한 뒤
     * 최근 메시지 50개를 조회한다.
     */
    @GetMapping("/{sessionId}/chat/messages")
    public ResponseEntity<?> getMessages(@PathVariable Long sessionId, @RequestHeader("X-Member-Id") Long memberId, HttpServletRequest request) {

        // 채팅 서비스에서 권한 검증 및 메시지 조회
        List<ChatMessageResponse> response = chatService.getMessages(sessionId, memberId);

        // 프로젝트 공통 API 응답 반환
        return apiResponseBuilder.ok(response, "채팅 메시지 조회 성공", request);
    }
}
