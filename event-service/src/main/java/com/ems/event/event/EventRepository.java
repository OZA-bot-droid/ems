package com.ems.event.event;

import jakarta.persistence.LockModeType;
import java.util.Collection;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
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
}

