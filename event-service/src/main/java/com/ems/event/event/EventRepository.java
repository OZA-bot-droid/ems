package com.ems.event.event;

import java.util.Collection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventRepository extends JpaRepository<Event, Long> {

    Page<Event> findByStatus(EventStatus status, Pageable pageable);

    /** 여러 상태 중 하나인 행사 (일반 회원용 목록: OPEN, CLOSED) */
    Page<Event> findByStatusIn(Collection<EventStatus> statuses, Pageable pageable);
}

