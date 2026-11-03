package com.ems.interaction.common.websocket.security;

import com.ems.interaction.mock.DemoData;
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
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;


@Slf4j
@Component
@RequiredArgsConstructor
public class StompAuthInterceptor implements ChannelInterceptor {

    // 데모용
    private final DemoData demoData;
    private final PollRepository pollRepository;

    // 로컬 개발 전용 테스트 토큰
    private static final String TEST_TOKEN = "Bearer test-token";

    // 실제 투표 변경 알림 Topic
    private static final Pattern POLL_TOPIC = Pattern.compile("^/topic/polls/(\\d+)/updates$");

    // 투표 상태 변경 Topic
    private static final Pattern SESSION_TOPIC = Pattern.compile("^/topic/sessions/(\\d+)/polls/status$");

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();

        try {

            if (StompCommand.CONNECT.equals(command)) {
                handleConnect(accessor);
            }

            if (StompCommand.SUBSCRIBE.equals(command)) {
                handleSubscribe(accessor);
            }

            if (StompCommand.SEND.equals(command)) {
                throw new IllegalArgumentException("STOMP SEND는 허용되지 않습니다.");
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

        if (!TEST_TOKEN.equals(authorization)) {
            throw new IllegalArgumentException("STOMP 인증 실패: 잘못된 토큰입니다.");
        }

        // 로컬 테스트용 사용자 ID
        String memberIdHeader = accessor.getFirstNativeHeader("X-Member-Id");

        if (memberIdHeader == null || memberIdHeader.isBlank()) {
            throw new IllegalArgumentException("STOMP 인증 실패: 사용자 ID가 누락되었습니다.");
        }

        Long userId;

        try {
            userId = Long.valueOf(memberIdHeader);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("STOMP 인증 실패: 사용자 ID 형식이 잘못되었습니다.");
        }

        // DemoData 회원 존재 여부 확인
        if (!demoData.members.containsKey(userId)) {
            throw new IllegalArgumentException("STOMP 인증 실패: 존재하지 않는 사용자입니다.");
        }

        // 실제 JWT 연결 시 교체할 부분
        Principal principal = () -> String.valueOf(userId);

        accessor.setUser(principal);

        log.info("[STOMP] CONNECT 성공 - userId: {}", userId);
    }

    // 2. Topic 구독 권한 검사
    private void handleSubscribe(StompHeaderAccessor accessor) {

        Principal principal = accessor.getUser();

        if (principal == null) {
            throw new IllegalArgumentException("STOMP 구독 실패: 인증되지 않은 사용자입니다.");
        }

        Long userId = Long.valueOf(principal.getName());

        String destination = accessor.getDestination();

        if (destination == null) {
            throw new IllegalArgumentException("STOMP 구독 실패: Topic이 없습니다.");
        }

        // 투표 결과 변경 알림 Topic
        Matcher pollMatcher = POLL_TOPIC.matcher(destination);

        if (pollMatcher.matches()) {

            Long pollId = Long.valueOf(pollMatcher.group(1));

            Poll poll = pollRepository.findById(pollId).orElseThrow(() -> new IllegalArgumentException("존재하지 않는 투표입니다."));

            if (!canAccessPoll(userId, poll)) {
                throw new IllegalArgumentException("STOMP 구독 실패: 투표 접근 권한이 없습니다.");
            }

            log.info("[STOMP] 투표 Topic 구독 허용 - userId: {}, pollId: {}", userId, pollId);

            return;
        }

        // 세션 상태 변경 알림 Topic
        Matcher sessionMatcher = SESSION_TOPIC.matcher(destination);

        if (sessionMatcher.matches()) {

            Long sessionId = Long.valueOf(sessionMatcher.group(1));

            if (!canAccessSession(userId, sessionId)) {
                throw new IllegalArgumentException("STOMP 구독 실패: 세션 접근 권한이 없습니다.");
            }

            log.info("[STOMP] 세션 Topic 구독 허용 - userId: {}, sessionId: {}", userId, sessionId);

            return;
        }

        // 정의하지 않은 Topic은 모두 차단
        throw new IllegalArgumentException("STOMP 구독 실패: 허용되지 않은 Topic입니다.");
    }

    // 3. 투표 접근 권한
    private boolean canAccessPoll(Long userId, Poll poll) {

        // 투표 생성자
        if (Objects.equals(poll.getUserId(), userId)) {
            return true;
        }

        // 세션 참가 승인 사용자
        for (DemoData.DemoRegistration reg : demoData.registrations) {

            if (Objects.equals(reg.userId(), userId) && Objects.equals(reg.eventId(), poll.getEventId()) && Objects.equals(reg.sessionId(), poll.getSessionId()) && "APPROVED".equals(reg.status())) {

                return true;
            }
        }

        return false;
    }

    // 4. 세션 접근 권한
    private boolean canAccessSession(Long userId, Long sessionId) {

        DemoData.DemoSession session = demoData.sessions.get(sessionId);

        if (session == null) {
            return false;
        }

        // 행사 생성자도 구독 허용
        DemoData.DemoEvent event = demoData.events.get(session.eventId());

        if (event != null && Objects.equals(event.createdBy(), userId)) {
            return true;
        }

        // 세션 참가 승인 사용자
        for (DemoData.DemoRegistration reg : demoData.registrations) {

            if (Objects.equals(reg.userId(), userId) && Objects.equals(reg.eventId(), session.eventId()) && Objects.equals(reg.sessionId(), sessionId) && "APPROVED".equals(reg.status())) {

                return true;
            }
        }

        return false;
    }
}
