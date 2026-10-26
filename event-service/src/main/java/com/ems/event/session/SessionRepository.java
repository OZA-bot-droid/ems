package com.ems.event.session;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SessionRepository extends JpaRepository<Session, Long> {

    /** 행사의 세션을 시작 시각 순서로 (화면의 시간표 순서) */
    List<Session> findByEventIdOrderByStartsAtAsc(Long eventId);

    /** 이 행사에 속한 세션인지까지 확인하며 찾기 */
    Optional<Session> findByIdAndEventId(Long id, Long eventId);

// 겹치지않은지, 끝나는 시간이 시작하는 시간보다 더 빠르지않은지
    @Query("""
            select case when count(s) > 0 then true else false end from Session s
            where s.event.id = :eventId
              and s.startsAt < :endsAt
              and s.endsAt > :startsAt
            """)
    boolean existsOverlap(@Param("eventId") Long eventId,
                          @Param("startsAt") Instant startsAt,
                          @Param("endsAt") Instant endsAt);

    /** 위와 같지만 수정 중인 자기 자신은 빼고 검사 (수정할 때) */
    @Query("""
            select case when count(s) > 0 then true else false end from Session s
            where s.event.id = :eventId
              and s.id <> :sessionId
              and s.startsAt < :endsAt
              and s.endsAt > :startsAt
            """)
    boolean existsOverlapExcluding(@Param("eventId") Long eventId,
                                   @Param("sessionId") Long sessionId,
                                   @Param("startsAt") Instant startsAt,
                                   @Param("endsAt") Instant endsAt);

    /** 행사 기간 밖으로 벗어나는 세션이 있는가? (행사 일정을 수정할 때) */
    @Query("""
            select case when count(s) > 0 then true else false end from Session s
            where s.event.id = :eventId
              and (s.startsAt < :eventStartsAt or s.endsAt > :eventEndsAt)
            """)
    boolean existsOutsidePeriod(@Param("eventId") Long eventId,
                                @Param("eventStartsAt") Instant eventStartsAt,
                                @Param("eventEndsAt") Instant eventEndsAt);
}
