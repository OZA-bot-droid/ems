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


@Entity
@Table(name = "events")
public class Event {

//    게시물 번호
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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
//    Instant를 하여서 나라별로 시간대를 설정하게 만듬 => frontend에서 format.js로 설정
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
    private Long createdBy;

//    화상 회의 링크 (Zoom, Jitsi 등 · 선택)
    @Column(name = "meeting_url", length = 500)
    private String meetingUrl;

    protected Event() {
        // JPA용
    }

    public Event(String title, String description, int capacity,
                 Instant startsAt, Instant endsAt, String meetingUrl, Long createdBy) {
        this.title = title;
        this.description = description;
        this.capacity = capacity;
        this.startsAt = startsAt;
        this.endsAt = endsAt;
        this.status = EventStatus.DRAFT; // 새 행사는 항상 작성 중으로 시작
        this.meetingUrl = meetingUrl;
        this.createdBy = createdBy;
    }

//  변경하지 않은 값은 그대로 유지
    public void update(String title, String description, Integer capacity,
                       Instant startsAt, Instant endsAt, String meetingUrl, EventStatus status) {
        if (title != null) this.title = title;
        if (description != null) this.description = description;
        if (capacity != null) this.capacity = capacity;
        if (startsAt != null) this.startsAt = startsAt;
        if (endsAt != null) this.endsAt = endsAt;
        if (meetingUrl != null) this.meetingUrl = meetingUrl;
        if (status != null) this.status = status;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public int getCapacity() { return capacity; }
    public Instant getStartsAt() { return startsAt; }
    public Instant getEndsAt() { return endsAt; }
    public EventStatus getStatus() { return status; }
    public Long getCreatedBy() { return createdBy; }
    public String getMeetingUrl() { return meetingUrl; }
}
