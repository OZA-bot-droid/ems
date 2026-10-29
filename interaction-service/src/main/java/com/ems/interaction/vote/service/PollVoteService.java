package com.ems.interaction.vote.service;


import com.ems.interaction.common.exception.ApiException;
import com.ems.interaction.poll.domain.Poll;
import com.ems.interaction.poll.domain.PollOption;
import com.ems.interaction.poll.domain.Status;
import com.ems.interaction.poll.repository.PollOptionRepository;
import com.ems.interaction.poll.repository.PollRepository;
import com.ems.interaction.vote.domain.PollVote;
import com.ems.interaction.vote.dto.PollResultDTO;
import com.ems.interaction.vote.dto.PollVoteResultDTO;
import com.ems.interaction.vote.dto.PollVoteSaveDTO;
import com.ems.interaction.vote.repository.PollVoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


// 임시 권한 데이터
import com.ems.interaction.mock.DemoData;

@Service
@Transactional
@RequiredArgsConstructor
public class PollVoteService {
    private final PollRepository pollRepository;
    private final PollOptionRepository pollOptionRepository;
    private final PollVoteRepository pollVoteRepository;

    // 임시 권한 데이터
    private final DemoData demoData;

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

    // 활성화 상태인 투표의 유저의 투표 기록 조회
    public List<PollVoteResultDTO> getActivePollVotes(Long userId, List<Long> pollIds){

        if (pollIds == null || pollIds.isEmpty()) {
            return List.of();
        }

        // 사용자의 투표 기록 조회
        List<PollVote> votes = pollVoteRepository.findByPollIdInAndUserId(pollIds, userId);

        List<PollVoteResultDTO> result = new ArrayList<>();

        for (PollVote vote : votes) {

            result.add(PollVoteResultDTO.from(
                    vote.getPollId(),
                    vote.getPollOptionId())
            );
        }

        return result;
    }


    // 투표 결과 조회 (권한 보유자)
    public PollResultDTO getPollResults(Long pollId, Long userId) {

        // 1. 투표 조회
        Poll poll = pollRepository.findById(pollId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "POLL_NOT_FOUND",
                        "투표를 찾을 수 없습니다."
                ));

        // 2. 사용자 확인
        if (userId == null || !demoData.members.containsKey(userId)) {
            throw new ApiException(
                    HttpStatus.UNAUTHORIZED,
                    "UNAUTHORIZED",
                    "유효하지 않은 사용자입니다."
            );
        }

        // 3. 투표 생성자 여부 확인
        boolean isOwner = poll.getUserId().equals(userId);

        // 4. 세션 참가 승인 여부 확인
        boolean isApproved = false;

        for (DemoData.DemoRegistration reg : demoData.registrations) {
            if (reg.userId().equals(userId)
                    && reg.eventId().equals(poll.getEventId())
                    && reg.sessionId().equals(poll.getSessionId())
                    && "APPROVED".equals(reg.status())) {

                isApproved = true;
                break;
            }
        }

        // 5. 투표 생성자도 아니고 참가 승인 사용자도 아니라면 거부
        if (!isOwner && !isApproved) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "FORBIDDEN",
                    "투표 결과를 조회할 권한이 없습니다."
            );
        }

        // 6. 참가자의 결과 공개 조건 확인
        // 생성자는 조회 허용
        // 참가자는 실시간 공개이거나 종료된 투표일 때만 허용
        if (!isOwner
                && !poll.isShowLiveResults()
                && poll.getStatus() != Status.CLOSED) {

            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "RESULT_NOT_AVAILABLE",
                    "투표 종료 후 결과를 확인할 수 있습니다."
            );
        }

        // 7. 해당 투표의 선택지 조회
        List<PollOption> options =
                pollOptionRepository.findByPollIdOrderByDisplayOrderAsc(pollId);

        // 8. 전체 투표 수 조회
        long totalVotes = pollVoteRepository.countByPollId(pollId);

        // 9. 선택지별 득표수 조회
        List<PollResultDTO.OptionResultDTO> optionResults = new ArrayList<>();

        for (PollOption option : options) {

            long voteCount = pollVoteRepository.countByPollIdAndPollOptionId(
                    pollId,
                    option.getId()
            );

            optionResults.add(PollResultDTO.OptionResultDTO.from(
                    option.getId(),
                    option.getContent(),
                    voteCount
            ));
        }

        // 10. 최종 응답 DTO 생성
        return PollResultDTO.from(pollId, totalVotes, optionResults);

    }
}
