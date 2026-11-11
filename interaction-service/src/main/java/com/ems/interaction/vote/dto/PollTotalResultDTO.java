package com.ems.interaction.vote.dto;

import com.ems.interaction.poll.domain.Poll;
import com.ems.interaction.poll.domain.Status;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

// 관리자 및 일반 사용자 결과 전용 페이지 응답 DTO
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PollTotalResultDTO {

    // 투표 ID
    private Long pollId;

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

    // 전체 투표 참여 수
    private Long totalVotes;

    // 선택지별 집계 결과
    private List<OptionResultDTO> options;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OptionResultDTO {

        // 선택지 ID
        private Long pollOptionId;

        // 선택지 내용
        private String content;

        // 선택지 득표수
        private Long voteCount;

        // 선택지별 결과 DTO 생성
        public static OptionResultDTO from(Long pollOptionId, String content, Long voteCount) {
            return OptionResultDTO.builder()
                    .pollOptionId(pollOptionId)
                    .content(content)
                    .voteCount(voteCount)
                    .build();
        }
    }

    // Poll Entity 및 집계 정보를 전체 결과 DTO로 변환
    public static PollTotalResultDTO from(Poll poll, Long totalVotes, List<OptionResultDTO> options) {
        return PollTotalResultDTO.builder()
                .pollId(poll.getId())
                .title(poll.getTitle())
                .eventId(poll.getEventId())
                .sessionId(poll.getSessionId())
                .status(poll.getStatus())
                .startsAt(poll.getStartsAt())
                .endsAt(poll.getEndsAt())
                .totalVotes(totalVotes)
                .options(options)
                .build();
    }
}
