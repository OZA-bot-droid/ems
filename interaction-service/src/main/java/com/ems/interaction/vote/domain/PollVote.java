package com.ems.interaction.vote.domain;

import com.ems.interaction.common.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "poll_vote")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PollVote extends BaseEntity {

    // 투표 참여 ID (PK)
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 투표 참여자 ID
    @Column(name = "user_id", nullable = false)
    private Long userId;

    // 투표 ID
    @Column(name = "poll_id", nullable = false)
    private Long pollId;

    // 선택한 투표 항목 ID
    @Column(name = "poll_option_id", nullable = false)
    private Long pollOptionId;

    // 세션 ID
    @Column(name = "session_id", nullable = false)
    private UUID sessionId;
}