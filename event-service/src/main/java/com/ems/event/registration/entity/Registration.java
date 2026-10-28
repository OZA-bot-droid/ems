package com.ems.event.registration.entity;

import jakarta.persistence.*;
import java.time.Instant;

/** 행사 참가 신청 한 건과 그 상태 변경 이력을 표현합니다. */
@Entity
@Table(
        name = "registrations",
        // 한 사용자가 같은 행사에 신청 행을 여러 개 만들지 못하게 합니다.
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

    /** 신청 행 자체를 식별하는 기본 키입니다. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Member Service에서 발급한 회원 ID입니다. */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** 신청 대상 행사 ID입니다. 행사 테이블과의 FK는 통합 시 연결합니다. */
    @Column(name = "event_id", nullable = false)
    private Long eventId;

    /** enum 이름을 문자열로 저장하며, 새 신청은 승인 대기 상태로 시작합니다. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RegistrationStatus status = RegistrationStatus.PENDING;

    /** 신청이 생성된 시각입니다. 한 번 저장한 뒤에는 변경하지 않습니다. */
    @Column(name = "requested_at", nullable = false, updatable = false)
    private Instant requestedAt;

    /** 신청 정보가 마지막으로 변경된 시각입니다. */
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /** 승인·거절·취소 등 신청 처리가 이루어진 시각입니다. */
    @Column(name = "decided_at")
    private Instant decidedAt;

    protected Registration() { }

    public Registration(Long userId, Long eventId) {
        this.userId = userId;
        this.eventId = eventId;
        this.status = RegistrationStatus.PENDING;
    }

    /** 새 신청을 저장할 때 신청 시각과 변경 시각을 함께 기록합니다. */
    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.requestedAt = now;
        this.updatedAt = now;
    }

    /** 엔티티가 수정될 때 변경 시각을 갱신합니다. */
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public Long getEventId() { return eventId; }
    public RegistrationStatus getStatus() { return status; }
    public Instant getRequestedAt() { return requestedAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public Instant getDecidedAt() { return decidedAt; }

    /** 승인 대기 중인 신청만 승인하고 처리 시각을 기록합니다. */
    public void approve() {
        requirePending();
        this.status = RegistrationStatus.APPROVED;
        this.decidedAt = Instant.now();
    }

    /** 승인 대기 중인 신청만 거절하고 처리 시각을 기록합니다. */
    public void reject() {
        requirePending();
        this.status = RegistrationStatus.REJECTED;
        this.decidedAt = Instant.now();
    }

    /** 승인 대기 또는 승인 완료 상태의 신청을 취소합니다. */
    public void cancel() {
        if (this.status != RegistrationStatus.PENDING
                && this.status != RegistrationStatus.APPROVED) {
            throw new IllegalStateException("현재 상태에서는 취소할 수 없습니다.");
        }
        this.status = RegistrationStatus.CANCELLED;
        this.decidedAt = Instant.now();
    }

    /** 승인·거절은 PENDING 상태에서만 가능하도록 검사합니다. */
    private void requirePending() {
        if (this.status != RegistrationStatus.PENDING) {
            throw new IllegalStateException("승인 대기 상태에서만 처리할 수 있습니다.");
        }
    }
}
