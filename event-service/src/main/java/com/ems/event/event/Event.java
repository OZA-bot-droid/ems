package com.ems.event.event;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * 행사. 테이블은 Flyway(V1__create_events.sql)가 만든다.
 */
@Entity
@Table(name = "events")
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private int capacity;

    @Column(name = "starts_at", nullable = false)
    private Instant startsAt;

    @Column(name = "ends_at", nullable = false)
    private Instant endsAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EventStatus status;

    /** 만든 관리자의 member-service 사용자 ID (외부 ID, 로그인 연동 전에는 null) */
    @Column(name = "created_by")
    private UUID createdBy;

    protected Event() {
        // JPA용
    }

    public Event(String title, String description, int capacity,
                 Instant startsAt, Instant endsAt, UUID createdBy) {
        this.title = title;
        this.description = description;
        this.capacity = capacity;
        this.startsAt = startsAt;
        this.endsAt = endsAt;
        this.status = EventStatus.DRAFT; // 새 행사는 항상 작성 중으로 시작
        this.createdBy = createdBy;
    }

    /** PATCH: null이 아닌 값만 바꾼다 */
    public void update(String title, String description, Integer capacity,
                       Instant startsAt, Instant endsAt, EventStatus status) {
        if (title != null) this.title = title;
        if (description != null) this.description = description;
        if (capacity != null) this.capacity = capacity;
        if (startsAt != null) this.startsAt = startsAt;
        if (endsAt != null) this.endsAt = endsAt;
        if (status != null) this.status = status;
    }

    public UUID getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public int getCapacity() { return capacity; }
    public Instant getStartsAt() { return startsAt; }
    public Instant getEndsAt() { return endsAt; }
    public EventStatus getStatus() { return status; }
    public UUID getCreatedBy() { return createdBy; }
}
