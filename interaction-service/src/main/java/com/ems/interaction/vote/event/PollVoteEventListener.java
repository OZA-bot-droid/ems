package com.ems.interaction.vote.event;

import lombok.RequiredArgsConstructor;

import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.event.TransactionPhase;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class PollVoteEventListener {

    private final SimpMessagingTemplate messagingTemplate;

    // 투표 저장 트랜잭션이 성공적으로 커밋 후 실행
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handlePollVoteUpdated(PollVoteUpdatedEvent event) {
        log.info("/topic/polls/{}/updates", event.pollId());
        log.info(Map.of("type", "POLL_VOTE_UPDATED", "pollId", event.pollId()).toString());

        messagingTemplate.convertAndSend("/topic/polls/" + event.pollId() + "/updates",
                Map.of("type", "POLL_VOTE_UPDATED", "pollId", event.pollId()));

        log.info("투표 결과 변경 알림 전송 - pollId: {}", event.pollId());
    }
}