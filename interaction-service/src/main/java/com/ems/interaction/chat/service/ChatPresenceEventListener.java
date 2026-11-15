package com.ems.interaction.chat.service;

import java.security.Principal;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;

import org.springframework.web.socket.messaging.SessionSubscribeEvent;
import org.springframework.web.socket.messaging.SessionUnsubscribeEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChatPresenceEventListener {

    private final ChatPresenceService presenceService;

    private static final Pattern CHAT_TOPIC = Pattern.compile("^/topic/sessions/([1-9]\\d*)/chat$");

    // 채팅방 구독 시 입장
    @EventListener
    public void onSubscribe(SessionSubscribeEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());

        String destination = accessor.getDestination();

        if (destination == null) return;

        Matcher matcher = CHAT_TOPIC.matcher(destination);

        // 투표 Topic 등 다른 구독은 제외
        if (!matcher.matches()) return;

        Principal principal = event.getUser();

        if (principal == null) return;

        try {
            Long sessionId = Long.valueOf(matcher.group(1));
            Long memberId = Long.valueOf(principal.getName());

            presenceService.join(sessionId, memberId, accessor.getSessionId(), accessor.getSubscriptionId());
        } catch (NumberFormatException ex) {
            log.warn("채팅 입장 사용자 ID 변환 실패", ex);
        }
    }

    // 채팅방 구독 해제 시 퇴장
    @EventListener
    public void onUnsubscribe(SessionUnsubscribeEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());

        presenceService.leave(accessor.getSessionId(), accessor.getSubscriptionId());
    }

    // WebSocket 연결 종료 시 남은 구독 정리
    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        presenceService.disconnect(event.getSessionId());
    }
}
