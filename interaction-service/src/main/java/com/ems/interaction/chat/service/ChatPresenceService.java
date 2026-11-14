package com.ems.interaction.chat.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class ChatPresenceService {

    private final SimpMessagingTemplate messagingTemplate;

    public ChatPresenceService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    // 연결 ID + 구독 ID로 실제 채팅방 참여를 구분
    private final Map<String, Attendance> subscriptions = new HashMap<>();

    // 세션별 이벤트 순서 관리
    private final Map<Long, Long> revisions = new HashMap<>();

    private record Attendance(Long sessionId, Long memberId, String connectionId) {
    }

    // WebSocket 방송 데이터
    public record PresenceEvent(String type, Long sessionId, Long memberId, int onlineCount, long revision,
                                Instant occurredAt) {
    }

    // 최초 접속 인원 조회 응답
    public record PresenceSnapshot(Long sessionId, int onlineCount, long revision) {
    }

    private String key(String connectionId, String subscriptionId) {
        return connectionId + ":" + subscriptionId;
    }

    private int count(Long sessionId) {
        Set<Long> members = new HashSet<>();

        for (Attendance attendance : subscriptions.values()) {
            if (attendance.sessionId().equals(sessionId)) {
                members.add(attendance.memberId());
            }
        }

        return members.size();
    }

    // 채팅방 입장
    public synchronized void join(Long sessionId, Long memberId, String connectionId, String subscriptionId) {
        if (sessionId == null || memberId == null || connectionId == null || subscriptionId == null) {
            return;
        }

        String key = key(connectionId, subscriptionId);

        // 동일 구독 중복 처리 방지
        if (subscriptions.containsKey(key)) {
            return;
        }

        int before = count(sessionId);

        subscriptions.put(key, new Attendance(sessionId, memberId, connectionId));

        int after = count(sessionId);

        // 고유 사용자 수가 늘어난 경우에만 입장 방송
        if (after > before) {
            broadcast("JOIN", sessionId, memberId, after);
        }
    }

    // 채팅방 구독 해제
    public synchronized void leave(String connectionId, String subscriptionId) {
        if (connectionId == null || subscriptionId == null) {
            return;
        }

        String key = key(connectionId, subscriptionId);
        Attendance target = subscriptions.get(key);

        if (target == null) {
            return;
        }

        int before = count(target.sessionId());

        subscriptions.remove(key);

        int after = count(target.sessionId());

        // 고유 사용자 수가 줄어든 경우에만 퇴장 방송
        if (after < before) {
            broadcast("LEAVE", target.sessionId(), target.memberId(), after);
        }
    }

    // WebSocket 연결 종료 시 모든 채팅방 구독 정리
    public synchronized void disconnect(String connectionId) {
        if (connectionId == null) return;

        var keys = new ArrayList<String>();

        for (var entry : subscriptions.entrySet()) {
            if (entry.getValue().connectionId().equals(connectionId)) {
                keys.add(entry.getKey());
            }
        }

        for (String key : keys) {
            int separator = key.indexOf(':');

            if (separator >= 0) {
                leave(key.substring(0, separator), key.substring(separator + 1));
            }
        }
    }

    // 현재 접속 현황
    public synchronized PresenceSnapshot snapshot(Long sessionId) {
        return new PresenceSnapshot(sessionId, count(sessionId), revisions.getOrDefault(sessionId, 0L));
    }

    // 입장/퇴장 WebSocket 방송
    private void broadcast(String type, Long sessionId, Long memberId, int onlineCount) {
        long revision = revisions.merge(sessionId, 1L, Long::sum);

        PresenceEvent event = new PresenceEvent(type, sessionId, memberId, onlineCount, revision, Instant.now());

        messagingTemplate.convertAndSend("/topic/sessions/" + sessionId + "/presence", event);
    }
}
