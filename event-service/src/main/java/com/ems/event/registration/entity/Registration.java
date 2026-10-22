package com.ems.event.registration.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
        name = "registrations",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_registration_user_event",
                columnNames = {"user_id", "event_id"}
        ),
        indexes = {
                @Index(name = "idx_registration_user_status", columnList = "user_id,status"),
                @Index(name = "idx_registration_event_status", columnList = "event_id,status")
        }
)
public class Registration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RegistrationStatus status = RegistrationStatus.PENDING;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "decided_at")
    private Instant decidedAt;

    protected Registration() { }

    public Registration(String userId, Long eventId) {
        this.userId = userId;
        this.eventId = eventId;
        this.status = RegistrationStatus.PENDING;
    }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getUserId() { return userId; }
    public Long getEventId() { return eventId; }
    public RegistrationStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public Instant getDecidedAt() { return decidedAt; }

    public void approve() {
        requirePending();
        this.status = RegistrationStatus.APPROVED;
        this.decidedAt = Instant.now();
    }

    public void reject() {
        requirePending();
        this.status = RegistrationStatus.REJECTED;
        this.decidedAt = Instant.now();
    }

    public void cancel() {
        if (this.status != RegistrationStatus.PENDING
                && this.status != RegistrationStatus.APPROVED) {
            throw new IllegalStateException("현재 상태에서는 취소할 수 없습니다.");
        }
        this.status = RegistrationStatus.CANCELLED;
        this.decidedAt = Instant.now();
    }

    private void requirePending() {
        if (this.status != RegistrationStatus.PENDING) {
            throw new IllegalStateException("승인 대기 상태에서만 처리할 수 있습니다.");
        }
    }
}
