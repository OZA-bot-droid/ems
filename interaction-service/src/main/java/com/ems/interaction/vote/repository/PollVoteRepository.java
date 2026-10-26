package com.ems.interaction.vote.repository;

import com.ems.interaction.vote.domain.PollVote;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PollVoteRepository extends JpaRepository<PollVote, Long> {

    // 중복 투표 확인
    boolean existsByPollIdAndUserId(Long pollId, Long userId);

    // 해당 투표 전체 참여 수
    long countByPollId(Long pollId);

    // 특정 선택지의 득표 수
    long countByPollIdAndPollOptionId(Long pollId, Long pollOptionId);

}
