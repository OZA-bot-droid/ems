package com.ems.interaction.poll.domain;


import com.ems.interaction.common.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "poll")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Poll extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 투표 제목
    @Column(name = "title", nullable = false, length = 255)
    private String title;

    // 투표 생성자 ID
    @Column(name = "user_id", nullable = false)
    private Long userId;

    // 행사 ID
    @Column(name = "event_id", nullable = false)
    private Long eventId;

    // 세션 ID
    @Column(name = "session_id", nullable = false)
    private Long sessionId;

    // 투표 상태 (기본값: SCHEDULED)
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private Status status = Status.SCHEDULED;

    // 투표 시작 시각
    @Column(name = "starts_at", nullable = false)
    private Instant startsAt;

    // 투표 종료 시각
    @Column(name = "ends_at", nullable = false)
    private Instant endsAt;

    // 실시간 결과 공개 허가
    @Column(name = "show_live_results", nullable = false)
    private boolean showLiveResults;

    // 투표 시작
    public void activate() {
        this.status = Status.ACTIVE;
    }

    // 투표 종료
    public void close() {
        this.status = Status.CLOSED;
    }

    // 투표 참여 가능 여부
    public boolean canVote() {
        Instant now = Instant.now();

        return status == Status.ACTIVE
                && !now.isBefore(startsAt)
                && now.isBefore(endsAt);
    }

    // 투표 활성화 가능 여부
    public boolean canActivate(Instant now) {
        return status == Status.SCHEDULED
                && !now.isBefore(startsAt)
                && now.isBefore(endsAt);
    }

    // 투표 비활성화(종료) 가능 여부
    public boolean canClose() {
        return status == Status.ACTIVE;
    }
}