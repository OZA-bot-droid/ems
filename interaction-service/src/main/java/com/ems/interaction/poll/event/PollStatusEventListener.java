package com.ems.interaction.poll.event;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;


import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class PollStatusEventListener {
    private final SimpMessagingTemplate messagingTemplate;

    // DB 트랜잭션이 성공적으로 커밋된 후 실행
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handlePollStatusChanged(PollStatusChangedEvent event) {

        String topic = "/topic/sessions/" + event.sessionId() + "/polls/status";

        Map<String, Object> message = Map.of("type", "POLL_STATUS_CHANGED", "pollId", event.pollId(), "sessionId", event.sessionId(), "status", event.status().name());

        // WebSocket 메시지 전송
        messagingTemplate.convertAndSend(topic, message);

        log.info("[STOMP] 투표 상태 변경 알림 전송 - pollId: {}, sessionId: {}, status: {}", event.pollId(), event.sessionId(), event.status());
    }
}
