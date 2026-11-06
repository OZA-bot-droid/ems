package com.ems.interaction.poll.scheduler;

import com.ems.interaction.poll.domain.Poll;
import com.ems.interaction.poll.domain.Status;
import com.ems.interaction.poll.event.PollStatusChangedEvent;
import com.ems.interaction.poll.repository.PollRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class PollStatusScheduler {

    private final PollRepository pollRepository;
    private final ApplicationEventPublisher eventPublisher;

    // 이전 실행이 종료된 후 5초마다 실행
    @Scheduled(fixedDelay = 5000)
    @Transactional
    public void updatePollStatus() {

        Instant now = Instant.now();

        // 1. 종료 시간이 지난 투표 조회
        List<Poll> expiredPolls = pollRepository.findByStatusInAndEndsAtLessThanEqual(List.of(Status.SCHEDULED, Status.ACTIVE), now);

        // 2. 종료 처리 및 이벤트 발행
        for (Poll poll : expiredPolls) {

            poll.close();

            eventPublisher.publishEvent(new PollStatusChangedEvent(poll.getId(), poll.getSessionId(), Status.CLOSED));
        }

        // 3. 활성화 가능한 예정 투표 조회
        List<Poll> scheduledPolls = pollRepository.findByStatusAndStartsAtLessThanEqual(Status.SCHEDULED, now);

        int activatedCount = 0;

        // 4. 활성화 처리 및 이벤트 발행
        for (Poll poll : scheduledPolls) {

            // 종료된 투표는 ACTIVE 처리하지 않음
            if (!poll.canActivate(now)) {
                continue;
            }

            poll.activate();
            activatedCount++;

            eventPublisher.publishEvent(new PollStatusChangedEvent(poll.getId(), poll.getSessionId(), Status.ACTIVE));
        }

        // 5. 변경 내역 출력
        if (activatedCount > 0 || !expiredPolls.isEmpty()) {

            log.info("투표 상태 변경 - ACTIVE: {}건, CLOSED: {}건", activatedCount, expiredPolls.size());
        }
    }
}
