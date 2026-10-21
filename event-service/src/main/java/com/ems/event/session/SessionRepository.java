package com.ems.event.session;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SessionRepository extends JpaRepository<Session, UUID> {

    /** 행사의 세션을 시작 시각 순서로 (화면의 시간표 순서) */
    List<Session> findByEventIdOrderByStartsAtAsc(UUID eventId);

    /** 이 행사에 속한 세션인지까지 확인하며 찾기 */
    Optional<Session> findByIdAndEventId(UUID id, UUID eventId);

    /**
     * 새 시간대 [startsAt, endsAt)와 겹치는 세션이 있는가? (생성할 때)
     * 겹침 조건: 기존 시작 < 새 종료 AND 기존 종료 > 새 시작
     * 14:00~14:45 다음에 14:45~15:30은 겹치지 않음 (끝과 시작이 같으면 허용)
     */
    @Query("""
            select case when count(s) > 0 then true else false end from Session s
            where s.event.id = :eventId
              and s.startsAt < :endsAt
              and s.endsAt > :startsAt
            """)
    boolean existsOverlap(@Param("eventId") UUID eventId,
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
    boolean existsOverlapExcluding(@Param("eventId") UUID eventId,
                                   @Param("sessionId") UUID sessionId,
                                   @Param("startsAt") Instant startsAt,
                                   @Param("endsAt") Instant endsAt);

    /** 행사 기간 밖으로 벗어나는 세션이 있는가? (행사 일정을 수정할 때) */
    @Query("""
            select case when count(s) > 0 then true else false end from Session s
            where s.event.id = :eventId
              and (s.startsAt < :eventStartsAt or s.endsAt > :eventEndsAt)
            """)
    boolean existsOutsidePeriod(@Param("eventId") UUID eventId,
                                @Param("eventStartsAt") Instant eventStartsAt,
                                @Param("eventEndsAt") Instant eventEndsAt);
}
