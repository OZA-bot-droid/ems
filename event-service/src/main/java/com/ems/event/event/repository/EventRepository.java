package com.ems.event.event.repository;

import com.ems.event.event.entity.Event;
import com.ems.event.event.entity.EventStatus;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.Collection;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EventRepository extends JpaRepository<Event, Long> {

    /** 행사별 승인 처리를 직렬화해 정원 초과를 막습니다. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from Event e where e.id = :eventId")
    Optional<Event> findByIdForUpdate(@Param("eventId") Long eventId);

    Page<Event> findByStatus(EventStatus status, Pageable pageable);

    /** 여러 상태 중 하나인 행사 (일반 회원용 목록: OPEN, CLOSED) */
    Page<Event> findByStatusIn(Collection<EventStatus> statuses, Pageable pageable);

    /** 공개 상태(OPEN, CLOSED) 전체 + 내가 만든 DRAFT (로그인한 회원의 목록) */
    @Query("select e from Event e where e.status in :statuses or (e.status = :draft and e.createdBy = :ownerId)")
    Page<Event> findVisibleTo(@Param("statuses") Collection<EventStatus> statuses,
                              @Param("draft") EventStatus draft,
                              @Param("ownerId") Long ownerId,
                              Pageable pageable);

    /** 내가 만든 행사 전체 (행사 관리 화면용, 모든 상태) */
    Page<Event> findByCreatedBy(Long createdBy, Pageable pageable);

    /** 내가 만든 특정 상태 행사 (status=DRAFT 필터용) */
    Page<Event> findByStatusAndCreatedBy(EventStatus status, Long createdBy, Pageable pageable);

    /**
     * 끝난 행사 자동 마감: 작성 중(DRAFT)·공개(OPEN) 행사 중 종료 시각(endsAt)이 지난 것을 한 번에 CLOSED로 바꾼다.
     * 행사를 하나씩 불러와 바꾸지 않고 UPDATE 문 한 번으로 처리 → 바뀐 행 수를 돌려준다.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update Event e set e.status = :closed where e.status in :targets and e.endsAt <= :now")
    int closeEndedEvents(@Param("targets") Collection<EventStatus> targets,
                         @Param("closed") EventStatus closed,
                         @Param("now") Instant now);
}
