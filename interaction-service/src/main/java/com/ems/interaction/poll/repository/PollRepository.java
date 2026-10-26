package com.ems.interaction.poll.repository;

import com.ems.interaction.poll.domain.Poll;
import org.springframework.data.jpa.repository.JpaRepository;

import com.ems.interaction.poll.domain.Poll;
import com.ems.interaction.poll.domain.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface PollRepository extends JpaRepository<Poll, Long> {

    // 행사별 투표 목록
    List<Poll> findByEventId(Long eventId);

    // 세션별 투표 목록
    List<Poll> findBySessionId(UUID sessionId);

    // 시작 시각이 지난 예정 투표 조회
    List<Poll> findByStatusAndStartsAtLessThanEqual(
            Status status,
            Instant now
    );

    // 종료 시각이 지난 진행 중 투표 조회
    List<Poll> findByStatusAndEndsAtLessThanEqual(
            Status status,
            Instant now
    );
}