package com.ems.event.session;

import com.ems.event.event.Event;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

/**
 * 세션: 행사 안의 한 시간대와 그 시간에 할 일.
 * 테이블은 Flyway(V5__create_sessions.sql)가 만든다.
 */
@Entity
@Table(name = "sessions")
public class Session {

//    세션 번호
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

//    어느 행사의 세션인지 (세션 여러 개 → 행사 하나, N:1)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

//    그 시간대에 할 일
    @Column(nullable = false, length = 500)
    private String title;

//    시작 시각
    @Column(name = "starts_at", nullable = false)
    private Instant startsAt;

//    종료 시각
    @Column(name = "ends_at", nullable = false)
    private Instant endsAt;


    protected Session() {
        // JPA용
    }

    public Session(Event event, String title,
                   Instant startsAt, Instant endsAt) {
        this.event = event;
        this.title = title;
        this.startsAt = startsAt;
        this.endsAt = endsAt;
    }

    /** PATCH: null이 아닌 값만 바꾼다 */
    public void update(String title,
                       Instant startsAt, Instant endsAt) {
        if (title != null) this.title = title;
        if (startsAt != null) this.startsAt = startsAt;
        if (endsAt != null) this.endsAt = endsAt;
    }

    public Long getId() { return id; }
    public Event getEvent() { return event; }
    public String getTitle() { return title; }
    public Instant getStartsAt() { return startsAt; }
    public Instant getEndsAt() { return endsAt; }
}
