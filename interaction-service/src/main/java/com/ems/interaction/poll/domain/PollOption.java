package com.ems.interaction.poll.domain;

import com.ems.interaction.common.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "poll_option")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PollOption extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 소속 투표 ID
    @Column(name = "poll_id", nullable = false)
    private Long pollId;

    // 선택지 내용
    @Column(name = "content", nullable = false, length = 255)
    private String content;

    // 선택지 표시 순서
    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    // 선택지 내용 수정
    public void updateContent(String content) {
        this.content = content;
    }

    // 선택지 표시 순서 수정
    public void updateDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }
}