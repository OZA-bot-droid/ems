package com.ems.interaction.vote.service;


import com.ems.interaction.common.exception.ApiException;
import com.ems.interaction.common.exception.ErrorCode;
import com.ems.interaction.poll.domain.Poll;
import com.ems.interaction.poll.domain.PollOption;
import com.ems.interaction.poll.domain.Status;
import com.ems.interaction.poll.repository.PollOptionRepository;
import com.ems.interaction.poll.repository.PollRepository;
import com.ems.interaction.vote.domain.PollVote;
import com.ems.interaction.vote.dto.PollResultDTO;
import com.ems.interaction.vote.dto.PollTotalResultDTO;
import com.ems.interaction.vote.dto.PollVoteResultDTO;
import com.ems.interaction.vote.dto.PollVoteSaveDTO;
import com.ems.interaction.vote.event.PollVoteUpdatedEvent;
import com.ems.interaction.vote.repository.PollVoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;


// 임시 권한 데이터
import com.ems.interaction.common.event.EventAuthorizationClient;

@Service
@Transactional
@RequiredArgsConstructor
public class PollVoteService {
    private final PollRepository pollRepository;
    private final PollOptionRepository pollOptionRepository;
    private final PollVoteRepository pollVoteRepository;
    private final ApplicationEventPublisher eventPublisher;

    // 임시 권한 데이터
    private final EventAuthorizationClient eventClient;

    //투표 진행
    public PollVote createVote(PollVoteSaveDTO dto, Long pollId, Long userId) {

        // 1. 투표 조회
        Poll poll = pollRepository.findById(pollId).orElseThrow(() -> new ApiException(ErrorCode.POLL_NOT_FOUND));

        // Event enrollment is per event, not per session.
        if (!eventClient.approved(poll.getEventId(), userId)) {
            throw new ApiException(ErrorCode.REGISTRATION_NOT_APPROVED);
        }
        eventClient.session(poll.getEventId(), poll.getSessionId());

        // 2. 진행 중인 투표인지 확인
        if (!poll.canVote()) {
            throw new ApiException(ErrorCode.POLL_NOT_ACTIVE);
        }

        // 3. 선택지가 해당 투표에 속하는지 확인
        boolean optionExists = pollOptionRepository.existsByPollIdAndId(poll.getId(), dto.getPollOptionId());

        if (!optionExists) {
            throw new ApiException(ErrorCode.INVALID_POLL_OPTION);
        }

        // 4. 중복 투표 확인
        if (pollVoteRepository.existsByPollIdAndUserId(poll.getId(), userId)) {
            throw new ApiException(ErrorCode.ALREADY_VOTED);
        }

        // 5. DTO → Entity 변환
        PollVote pollVote = dto.toEntity(userId, poll);

//        // 6. 저장
//        return pollVoteRepository.save(pollVote);

        // WebSocket 연동 이후
        // 6. 투표 저장
        PollVote savedVote = pollVoteRepository.save(pollVote);

        // 7. 투표 결과 변경 이벤트 발행
        eventPublisher.publishEvent(new PollVoteUpdatedEvent(pollId));

        return savedVote;
    }

    // 활성화 상태인 투표의 유저의 투표 기록 조회
    public List<PollVoteResultDTO> getActivePollVotes(Long userId, List<Long> pollIds) {

        if (pollIds == null || pollIds.isEmpty()) {
            return List.of();
        }

        // 사용자의 투표 기록 조회
        List<PollVote> votes = pollVoteRepository.findByPollIdInAndUserId(pollIds, userId);

        List<PollVoteResultDTO> result = new ArrayList<>();

        for (PollVote vote : votes) {

            result.add(PollVoteResultDTO.from(vote.getPollId(), vote.getPollOptionId()));
        }

        return result;
    }


    // 투표 결과 조회 (권한 보유자)
    public PollResultDTO getPollResults(Long pollId, Long userId) {

        // 1. 투표 조회
        Poll poll = pollRepository.findById(pollId).orElseThrow(() -> new ApiException(ErrorCode.POLL_NOT_FOUND));

        if (userId == null) throw new ApiException(ErrorCode.UNAUTHORIZED);
        boolean isOwner = eventClient.owner(poll.getEventId(), userId);
        boolean isApproved = isOwner || eventClient.approved(poll.getEventId(), userId);
        eventClient.session(poll.getEventId(), poll.getSessionId());
        if (!isApproved) throw new ApiException(ErrorCode.REGISTRATION_NOT_APPROVED);

        // 6. 결과 공개 조건 확인
        // 생성자는 조회 허용
        // 참가자는 실시간 공개이거나 종료된 투표일 때만 허용
        if (!isOwner && !poll.isShowLiveResults() && poll.getStatus() != Status.CLOSED) {

            throw new ApiException(HttpStatus.FORBIDDEN, "RESULT_NOT_AVAILABLE", "투표 종료 후 결과를 확인할 수 있습니다.");
        }

        // 7. 해당 투표의 선택지 조회
        List<PollOption> options = pollOptionRepository.findByPollIdOrderByDisplayOrderAsc(pollId);

        // 8. 전체 투표 수 조회
        long totalVotes = pollVoteRepository.countByPollId(pollId);

        // 9. 선택지별 득표수 조회
        List<PollResultDTO.OptionResultDTO> optionResults = new ArrayList<>();

        for (PollOption option : options) {

            long voteCount = pollVoteRepository.countByPollIdAndPollOptionId(pollId, option.getId());

            optionResults.add(PollResultDTO.OptionResultDTO.from(option.getId(), option.getContent(), voteCount));
        }

        // 10. 최종 응답 DTO 생성
        return PollResultDTO.from(pollId, totalVotes, optionResults);

    }

    // 11/10 추가
    // 결과 전용 페이지의 상세 투표 결과 조회
    public PollTotalResultDTO getPollTotalResults(Long pollId, Long userId) {

        // 1. 기존 결과 조회 메서드 재사용
        // 사용자 인증, 생성자 권한, 참가 승인, 결과 공개 여부 검사
        PollResultDTO result = getPollResults(pollId, userId);

        // 2. 투표 기본 정보 조회
        Poll poll = pollRepository.findById(pollId).orElseThrow(() -> new ApiException(ErrorCode.POLL_NOT_FOUND));

        // 3. 기존 선택지별 결과를 새 DTO 형식으로 변환
        List<PollTotalResultDTO.OptionResultDTO> options = result.getOptions().stream().map(
                        option -> PollTotalResultDTO.OptionResultDTO.builder()
                                .pollOptionId(option.getPollOptionId())
                                .content(option.getContent())
                                .voteCount(option.getVoteCount())
                                .build())
                                .toList();

        // 4. 상세 결과 응답 DTO 반환
        return PollTotalResultDTO.from(poll, result.getTotalVotes(), options);
    }
}
