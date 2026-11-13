package com.ems.interaction.common.websocket.security;

import com.ems.interaction.common.event.EventAuthorizationClient;
import com.ems.interaction.poll.domain.Poll;
import com.ems.interaction.poll.repository.PollRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.context.annotation.Profile;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;

@Slf4j
@Component
@RequiredArgsConstructor
public class StompAuthInterceptor implements ChannelInterceptor {

    // 데모용
    private final EventAuthorizationClient eventClient;
    private final PollRepository pollRepository;
    private final JwtDecoder jwtDecoder;


    // 실제 투표 변경 알림 Topic
    private static final Pattern POLL_TOPIC = Pattern.compile("^/topic/polls/(\\d+)/updates$");

    // 투표 상태 변경 Topic
    private static final Pattern SESSION_TOPIC = Pattern.compile("^/topic/sessions/(\\d+)/polls/status$");

    // 채팅 메시지 전송 경로
    private static final Pattern CHAT_SEND_PATTERN = Pattern.compile("^/app/sessions/([1-9]\\d*)/chat\\.send$");

    // 채팅 메시지 구독 Topic
    private static final Pattern CHAT_SUBSCRIBE_PATTERN = Pattern.compile("^/topic/sessions/([1-9]\\d*)/chat$");

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();

        try {
            // 1. STOMP 연결 인증
            if (StompCommand.CONNECT.equals(command)) {
                handleConnect(accessor);
            }

            // 2. Topic 구독 권한 검사
            if (StompCommand.SUBSCRIBE.equals(command)) {
                handleSubscribe(accessor);
            }

            // 3. 채팅 메시지 전송 권한 검사
            if (StompCommand.SEND.equals(command)) {
                handleSend(accessor);
            }

            return message;

        } catch (IllegalArgumentException e) {

            log.warn("[STOMP] 요청 거부 - command: {}, destination: {}, reason: {}", command, accessor.getDestination(), e.getMessage());

            // 기존 STOMP 요청 차단 동작 유지
            throw e;
        }
    }

    // 1. STOMP 연결 인증
    private void handleConnect(StompHeaderAccessor accessor) {

        String authorization = accessor.getFirstNativeHeader("Authorization");

        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new IllegalArgumentException("STOMP 인증 실패: Access Token이 없습니다.");
        }

        String accessToken = authorization.substring(7).trim();

        Jwt jwt;

        try {
            jwt = jwtDecoder.decode(accessToken);
        } catch (JwtException e) {
            throw new IllegalArgumentException("STOMP 인증 실패: 유효하지 않은 JWT입니다.");
        }

        if (!"access".equals(jwt.getClaimAsString("token_type"))) {
            throw new IllegalArgumentException("STOMP 인증 실패: Access Token이 아닙니다.");
        }

        Long userId;

        try {
            userId = Long.valueOf(jwt.getSubject());

            if (userId <= 0) {
                throw new NumberFormatException();
            }
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("STOMP 인증 실패: 사용자 ID가 올바르지 않습니다.");
        }

        String role = jwt.getClaimAsString("role");

        if (!"USER".equals(role) && !"ADMIN".equals(role)) {
            throw new IllegalArgumentException("STOMP 인증 실패: 사용자 역할이 올바르지 않습니다.");
        }

        // JWT 검증을 마친 사용자 ID를 Principal에 등록
        accessor.setUser(() -> String.valueOf(userId));

//        log.info("[STOMP] JWT CONNECT 성공 - userId: {}, role: {}", userId, role);
    }


    /* ==========================================
       2. Topic 구독 권한 검사
    ========================================== */

    private void handleSubscribe(StompHeaderAccessor accessor) {

        Principal principal = accessor.getUser();

        if (principal == null) {
            throw new IllegalArgumentException("STOMP 구독 실패: 인증되지 않은 사용자입니다.");
        }

        Long userId = getAuthenticatedUserId(principal);

        String destination = accessor.getDestination();

        if (destination == null) {
            throw new IllegalArgumentException("STOMP 구독 실패: Topic이 없습니다.");
        }


        /* ----------------------------------
           2-1. 기존 투표 결과 변경 Topic
        ---------------------------------- */

        Matcher pollMatcher = POLL_TOPIC.matcher(destination);

        if (pollMatcher.matches()) {

            Long pollId = Long.valueOf(pollMatcher.group(1));

            Poll poll = pollRepository.findById(pollId).orElseThrow(() -> new IllegalArgumentException("존재하지 않는 투표입니다."));

            if (!canAccessPoll(userId, poll)) {

                throw new IllegalArgumentException("STOMP 구독 실패: 투표 접근 권한이 없습니다.");
            }

//            log.info("[STOMP] 투표 Topic 구독 허용 - userId: {}, pollId: {}", userId, pollId);

            return;
        }


        /* ----------------------------------
           2-2. 기존 세션 투표 상태 변경 Topic
        ---------------------------------- */

        Matcher sessionMatcher = SESSION_TOPIC.matcher(destination);

        if (sessionMatcher.matches()) {

            Long sessionId = Long.valueOf(sessionMatcher.group(1));

            if (!canAccessSession(userId, sessionId)) {

                throw new IllegalArgumentException("STOMP 구독 실패: 세션 접근 권한이 없습니다.");
            }

//            log.info("[STOMP] 세션 투표 Topic 구독 허용 - userId: {}, sessionId: {}", userId, sessionId);

            return;
        }


        /* ----------------------------------
           2-3. 신규 채팅 Topic 구독
        ---------------------------------- */

        Matcher chatMatcher = CHAT_SUBSCRIBE_PATTERN.matcher(destination);

        if (chatMatcher.matches()) {

            Long sessionId = Long.valueOf(chatMatcher.group(1));

            // Event Service에서 해당 세션 접근 권한 확인
            if (!canAccessSession(userId, sessionId)) {

                throw new IllegalArgumentException("STOMP 구독 실패: 채팅방 접근 권한이 없습니다.");
            }

//            log.info("[STOMP] 채팅 Topic 구독 허용 - userId: {}, sessionId: {}", userId, sessionId);

            return;
        }


        // 정의하지 않은 Topic은 모두 차단
        throw new IllegalArgumentException("STOMP 구독 실패: 허용되지 않은 Topic입니다.");
    }


    /* ==========================================
       3. 채팅 메시지 전송 권한 검사
    ========================================== */

    private void handleSend(StompHeaderAccessor accessor) {

        Principal principal = accessor.getUser();

        if (principal == null) {

            throw new IllegalArgumentException("STOMP 전송 실패: 인증되지 않은 사용자입니다.");
        }

        Long userId = getAuthenticatedUserId(principal);

        String destination = accessor.getDestination();

        if (destination == null) {

            throw new IllegalArgumentException("STOMP 전송 실패: 목적지가 없습니다.");
        }

        // 채팅 전송 경로만 허용
        Matcher chatMatcher = CHAT_SEND_PATTERN.matcher(destination);

        if (!chatMatcher.matches()) {

            throw new IllegalArgumentException("STOMP 전송 실패: 허용되지 않은 전송 경로입니다.");
        }

        Long sessionId = Long.valueOf(chatMatcher.group(1));

        // Event Service에서 세션 접근 권한 확인
        if (!canAccessSession(userId, sessionId)) {

            throw new IllegalArgumentException("STOMP 전송 실패: 채팅 참여 권한이 없습니다.");
        }

        log.info("[STOMP] 채팅 메시지 전송 허용 - userId: {}, sessionId: {}", userId, sessionId);
    }


    /* ==========================================
       4. 인증된 사용자 ID 추출
    ========================================== */

    private Long getAuthenticatedUserId(Principal principal) {

        try {

            Long userId = Long.valueOf(principal.getName());

            if (userId <= 0) {
                throw new NumberFormatException();
            }

            return userId;

        } catch (NumberFormatException e) {

            throw new IllegalArgumentException("STOMP 인증 실패: 사용자 ID가 올바르지 않습니다.");
        }
    }


    /* ==========================================
       5. 기존 투표 및 세션 접근 권한 검사
    ========================================== */

    private boolean canAccessPoll(Long userId, Poll poll) {

        EventAuthorizationClient.SessionAccess access = eventClient.sessionAccess(poll.getSessionId(), userId);

        if (!Objects.equals(access.eventId(), poll.getEventId())) {
            return false;
        }

        return access.owner() || access.approved();
    }

    private boolean canAccessSession(Long userId, Long sessionId) {

        return eventClient.allowedSession(sessionId, userId);
    }
}
