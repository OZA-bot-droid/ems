package com.ems.interaction.vote.service;

import com.ems.interaction.poll.domain.Poll;
import com.ems.interaction.poll.repository.PollOptionRepository;
import com.ems.interaction.poll.repository.PollRepository;
import com.ems.interaction.vote.domain.PollVote;
import com.ems.interaction.vote.dto.PollVoteSaveDTO;
import com.ems.interaction.vote.repository.PollVoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class PollVoteService {
    private final PollRepository pollRepository;
    private final PollOptionRepository pollOptionRepository;
    private final PollVoteRepository pollVoteRepository;

    public PollVote createVote(PollVoteSaveDTO dto, Long pollId,Long userId) {

        // 1. 투표 조회
        Poll poll = pollRepository.findById(pollId).orElseThrow(()
                -> new IllegalArgumentException("존재하지 않는 투표입니다."));

        // 2. 진행 중인 투표인지 확인
        if (!poll.canVote()) {
            throw new IllegalArgumentException("현재 참여할 수 없는 투표입니다.");
        }

        // 3. 선택지가 해당 투표에 속하는지 확인
        boolean optionExists = pollOptionRepository.existsByPollIdAndId(poll.getId(), dto.getPollOptionId());

        if (!optionExists) {
            throw new IllegalArgumentException("해당 투표에 속하지 않는 선택지입니다.");
        }

        // 4. 중복 투표 확인
        if (pollVoteRepository.existsByPollIdAndUserId(poll.getId(), userId)) {
            throw new IllegalArgumentException("이미 참여한 투표입니다.");
        }

        // 5. DTO → Entity 변환
        PollVote pollVote = dto.toEntity(userId, poll);

        // 6. 저장
        return pollVoteRepository.save(pollVote);
    }
}
