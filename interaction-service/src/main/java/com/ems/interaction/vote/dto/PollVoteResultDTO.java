package com.ems.interaction.vote.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PollVoteResultDTO {

    // 투표 ID
    private Long pollId;

    // 현재 사용자가 투표한 선택지 ID
    private Long pollOptionId;

    //builder
    public static PollVoteResultDTO from(Long pollId, Long pollOptionId) {

        return PollVoteResultDTO.builder()
                .pollId(pollId)
                .pollOptionId(pollOptionId)
                .build();
    }
}