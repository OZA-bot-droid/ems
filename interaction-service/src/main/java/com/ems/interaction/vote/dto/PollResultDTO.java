package com.ems.interaction.vote.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PollResultDTO {

    // 투표 ID
    private Long pollId;

    // 전체 투표 수
    private Long totalVotes;

    // 선택지별 투표 결과
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

        // 해당 선택지 득표수
        private Long voteCount;

        public static OptionResultDTO from(
                Long pollOptionId,
                String content,
                Long voteCount) {

            return OptionResultDTO.builder()
                    .pollOptionId(pollOptionId)
                    .content(content)
                    .voteCount(voteCount)
                    .build();
        }
    }


    public static PollResultDTO from(Long pollId, Long totalVotes, List<OptionResultDTO> options){

        return PollResultDTO.builder()
                .pollId(pollId)
                .totalVotes(totalVotes)
                .options(options)
                .build();
    }

}