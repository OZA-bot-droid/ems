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

//    게시물 번호
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

//    제목
    @Column(nullable = false, length = 200)
    private String title;

//    소개
    @Column(length = 2000)
    private String description;

//    최대 정원
    @Column(nullable = false)
    private int capacity;

//    시작하는 날짜
    @Column(name = "starts_at", nullable = false)
    private Instant startsAt;

//    끝나는 날짜
    @Column(name = "ends_at", nullable = false)
    private Instant endsAt;

//    상태(DRAFT,OPEN,CLOSE)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EventStatus status;

//    만든사람
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
