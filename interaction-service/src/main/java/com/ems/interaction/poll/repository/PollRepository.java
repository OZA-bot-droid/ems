package com.ems.interaction.poll.repository;

import com.ems.interaction.poll.domain.Poll;
import org.springframework.data.jpa.repository.JpaRepository;

import com.ems.interaction.poll.domain.Poll;
import com.ems.interaction.poll.domain.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PollRepository extends JpaRepository<Poll, Long> {

    // 행사별 투표 목록
    List<Poll> findByEventId(Long eventId);

    // 세션별 투표 목록
    List<Poll> findBySessionId(Long sessionId);

    // 시작 시각이 지난 예정 투표 조회
    List<Poll> findByStatusAndStartsAtLessThanEqual(Status status, Instant now);

    // 종료 시간이 지난 SCHEDULED 또는 ACTIVE 투표 조회
    List<Poll> findByStatusInAndEndsAtLessThanEqual(Collection<Status> statuses, Instant now);

    // 종료 시각이 지난 진행 중 투표 조회
    List<Poll> findByStatusAndEndsAtLessThanEqual(Status status, Instant now);

    // 관리자가 생성한 투표 목록 조회(최신순)
    List<Poll> findByUserIdOrderByIdDesc(Long userId);

    // 여러 세션에 속한 ACTIVE 투표 조회
    List<Poll> findBySessionIdInAndStatus(Collection<Long> sessionIds, Status status);


    // 관리자가 생성한 투표 목록 페이지 조회 (ID 내림차순)
    Page<Poll> findByUserIdOrderByIdDesc(Long userId, Pageable pageable);


    // SCHEDULED → ACTIVE
    // 시작 시간이 된 투표를 ACTIVE로 변경
    @Modifying
    @Query("""
    UPDATE Poll p
    SET p.status = :active,
        p.updatedAt = :now
    WHERE p.status = :scheduled
      AND p.startsAt <= :now
      AND p.endsAt > :now
    """)
    int activateScheduledPolls(
            @Param("scheduled") Status scheduled,
            @Param("active") Status active,
            @Param("now") Instant now
    );


    // SCHEDULED 또는 ACTIVE → CLOSED
    // 종료 시간이 지난 투표를 CLOSED로 변경
    @Modifying
    @Query("""
    UPDATE Poll p
    SET p.status = :closed,
        p.updatedAt = :now
    WHERE p.status IN :statuses
      AND p.endsAt <= :now
    """)
    int closeExpiredPolls(
            @Param("statuses") Collection<Status> statuses,
            @Param("closed") Status closed,
            @Param("now") Instant now
    );
}