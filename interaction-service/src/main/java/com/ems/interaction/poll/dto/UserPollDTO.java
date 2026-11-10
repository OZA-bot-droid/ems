package com.ems.interaction.poll.dto;

import com.ems.interaction.poll.domain.Poll;
import com.ems.interaction.poll.domain.Status;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

//11/10 추가
// 참가 승인된 세션의 전체 투표 목록 응답 DTO
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPollDTO {

    // 투표 ID
    private Long id;

    // 투표 제목
    private String title;

    // 행사 ID
    private Long eventId;

    // 세션 ID
    private Long sessionId;

    // 투표 상태
    private Status status;

    // 투표 시작 시간
    private Instant startsAt;

    // 투표 종료 시간
    private Instant endsAt;

    // 실시간 결과 공개 여부
    private Boolean showLiveResults;

    // 현재 사용자의 결과 조회 가능 여부
    private boolean canViewResults;

    // Poll Entity -> UserPollDTO 변환
    public static UserPollDTO from(Poll poll) {

        // 종료된 투표이거나 진행 중이며 실시간 결과 공개가 허용된 경우
        boolean canViewResults = poll.getStatus() == Status.CLOSED || (poll.getStatus() == Status.ACTIVE && poll.isShowLiveResults());

        return UserPollDTO.builder()
                .id(poll.getId())
                .title(poll.getTitle())
                .eventId(poll.getEventId())
                .sessionId(poll.getSessionId())
                .status(poll.getStatus())
                .startsAt(poll.getStartsAt())
                .endsAt(poll.getEndsAt())
                .showLiveResults(poll.isShowLiveResults())
                .canViewResults(canViewResults)
                .build();
    }
}
