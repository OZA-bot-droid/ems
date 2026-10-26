package com.ems.interaction.vote.dto;

import com.ems.interaction.poll.domain.Poll;
import com.ems.interaction.vote.domain.PollVote;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;


@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PollVoteSaveDTO {

    private Long pollOptionId;

    // 요청 DTO → PollVote Entity 변환
    public PollVote toEntity(Long userId, Poll poll) {

        return PollVote.builder()
                .userId(userId)
                .pollId(poll.getId())
                .pollOptionId(this.pollOptionId)
                .sessionId(poll.getSessionId())
                .build();
    }
}
