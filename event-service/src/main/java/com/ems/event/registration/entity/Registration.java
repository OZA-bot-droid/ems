
package com.ems.event.registration.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "registrations",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_registration_user_event",
                        columnNames = {"user_id", "event_id"}
                )
        }
)
public class Registration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RegistrationStatus status = RegistrationStatus.PENDING;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    protected Registration() {
        // JPA 기본 생성자
    }

    // 참가 신청 생성
    public Registration(Long userId, Long eventId) {
        this.userId = userId;
        this.eventId = eventId;
        this.status = RegistrationStatus.PENDING;
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getEventId() {
        return eventId;
    }

    public RegistrationStatus getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    // 승인 대기 상태에서만 승인 가능
    public void approve() {
        if (this.status != RegistrationStatus.PENDING) {
            throw new IllegalStateException(
                    "승인 대기 상태에서만 승인할 수 있습니다."
            );
        }
        this.status = RegistrationStatus.APPROVED;
    }

    // 승인 대기 상태에서만 거절 가능
    public void reject() {
        if (this.status != RegistrationStatus.PENDING) {
            throw new IllegalStateException(
                    "승인 대기 상태에서만 거절할 수 있습니다."
            );
        }
        this.status = RegistrationStatus.REJECTED;
    }

    // 대기 중이거나 승인된 신청만 취소 가능
    public void cancel() {
        if (this.status != RegistrationStatus.PENDING
                && this.status != RegistrationStatus.APPROVED) {
            throw new IllegalStateException(
                    "현재 상태에서는 취소할 수 없습니다."
            );
        }
        this.status = RegistrationStatus.CANCELLED;
    }
}
