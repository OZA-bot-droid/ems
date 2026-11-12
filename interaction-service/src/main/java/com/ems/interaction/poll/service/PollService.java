package com.ems.interaction.poll.service;

import com.ems.interaction.common.exception.ErrorCode;
import com.ems.interaction.poll.dto.PollManagementDTO;
import com.ems.interaction.common.exception.ApiException;
import com.ems.interaction.poll.domain.Poll;
import com.ems.interaction.poll.domain.PollOption;
import com.ems.interaction.poll.dto.PollSaveDTO;
import com.ems.interaction.poll.dto.PollResponseDTO;
import com.ems.interaction.poll.dto.UserPollDTO;
import com.ems.interaction.poll.repository.PollRepository;
import com.ems.interaction.poll.repository.PollOptionRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import org.springframework.http.HttpStatus;
import com.ems.interaction.poll.domain.Status;


// 이벤트 연동
import com.ems.interaction.common.event.EventAuthorizationClient;

import java.util.Map;
import java.util.stream.Collectors;

import com.ems.interaction.poll.event.PollStatusChangedEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@Service
@Transactional
@RequiredArgsConstructor
public class PollService {

    private final PollRepository pollRepository;
    private final PollOptionRepository pollOptionRepository;
    private final ApplicationEventPublisher eventPublisher;

    // 이벤트 연동
    private final EventAuthorizationClient eventClient;

    // 투표 생성
    public PollResponseDTO createPoll(PollSaveDTO dto, Long userId) {

        // 인증된 관리자 ID 검증
        if (userId == null) {
            throw new ApiException(ErrorCode.UNAUTHORIZED);
        }

        EventAuthorizationClient.EventAccess access = eventClient.eventAccess(dto.getEventId(), userId);

        // 해당 행사 주최자 확인
        if (!access.owner()) throw new ApiException(ErrorCode.EVENT_OWNER_REQUIRED);

        // 종료된 행사인지 확인
        if ("CLOSED".equals(access.status())) {
            throw new ApiException(HttpStatus.CONFLICT, "EVENT_CLOSED", "마감된 행사에는 투표를 생성할 수 없습니다.");
        }

        // 세션 진행 시간 동안으로 생성하는지 확인
        EventAuthorizationClient.SessionInfo session = eventClient.session(dto.getEventId(), dto.getSessionId());
        if (dto.getStartsAt().isBefore(session.startsAt()) ||
            dto.getEndsAt().isAfter(session.endsAt())) {
            throw new ApiException(ErrorCode.INVALID_PERIOD);
        }

        // 투표 시작·종료 시간 검증
        if (!dto.getEndsAt().isAfter(dto.getStartsAt())) {
            throw new ApiException(ErrorCode.INVALID_PERIOD);
        }

        // 투표 시작·종료 시간 검증
        if (!dto.getStartsAt().isAfter(Instant.now())) {
            throw new ApiException(ErrorCode.INVALID_PERIOD);
        }

        // 선택지 최소 2개 검증
        if (dto.getOptions() == null || dto.getOptions().size() < 2) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR);
        }

        // 투표 Entity 생성
        Poll poll = dto.toEntity(userId);

        // poll 테이블 저장
        Poll savedPoll = pollRepository.save(poll);

        // 선택지 Entity 생성
        List<PollOption> options = new ArrayList<>();

        for (int i = 0; i < dto.getOptions().size(); i++) {
            String content = dto.getOptions().get(i).getContent().trim();
            PollOption option = PollOption.builder().pollId(savedPoll.getId()).content(content).displayOrder(i).build();

            options.add(option);
        }

        // poll_option 테이블 저장
        List<PollOption> savedOptions = pollOptionRepository.saveAll(options);

        // 응답 DTO 생성
        return PollResponseDTO.from(savedPoll, savedOptions);
    }

    // 투표 상세 조회
    public PollResponseDTO getPoll(Long pollId, Long memberId) {

        Poll poll = pollRepository.findById(pollId).orElseThrow(() -> new ApiException(ErrorCode.POLL_NOT_FOUND));

        // 소유자 / 세션 허가 확인
        EventAuthorizationClient.SessionAccess access = eventClient.sessionAccess(poll.getSessionId(), memberId);
        if (!Objects.equals(access.eventId(), poll.getEventId()) ||
            (!access.owner() && !access.approved())) {
            throw new ApiException(ErrorCode.REGISTRATION_NOT_APPROVED);
        }

        List<PollOption> options = pollOptionRepository.findByPollIdOrderByDisplayOrderAsc(pollId);

        return PollResponseDTO.from(poll, options);
    }


    // 관리자가 생성한 투표 목록 페이지 조회
    public Page<PollManagementDTO> getMyCreatedPolls(Long userId, int page, int size, Long eventId, Long sessionId) {
        // 페이지 번호와 크기 검증
        if (page < 0 || size < 1 || size > 100) {
            throw new ApiException(ErrorCode.INVALID_REQUEST);
        }

        // Pageable 생성
        Pageable pageable = PageRequest.of(page, size);

        // 해당 관리자의 투표만 페이지 조회
        Page<Poll> polls;
        if (eventId != null && sessionId != null) {
            polls = pollRepository.findByUserIdAndEventIdAndSessionIdOrderByIdDesc(userId, eventId, sessionId, pageable);
        } else if (eventId != null) {
            polls = pollRepository.findByUserIdAndEventIdOrderByIdDesc(userId, eventId, pageable);
        } else if (sessionId != null) {
            polls = pollRepository.findByUserIdAndSessionIdOrderByIdDesc(userId, sessionId, pageable);
        } else {
            polls = pollRepository.findByUserIdOrderByIdDesc(userId, pageable);
        }

        Instant now = Instant.now();

        // Page<Poll> -> Page<PollManagementDTO>
        return polls.map(poll -> PollManagementDTO.from(poll, now));
    }

    // 유저가 참여 중인 세션의 활성화 상태인 투표 목록 전달
    public List<PollResponseDTO> getActivePolls(Long userId) {


        // 2. 사용자가 참가 승인받은 세션 조회
        List<Long> sessionIds = eventClient.accessibleSessions(userId);

        // 3. 승인된 세션이 없으면 빈 목록 반환
        if (sessionIds.isEmpty()) {
            return List.of();
        }

        // 4. 해당 세션에 속한 ACTIVE 투표 조회
        List<Poll> polls = pollRepository.findBySessionIdInAndStatus(sessionIds, Status.ACTIVE);

        if (polls.isEmpty()) {
            return List.of();
        }

        // 5. 조회한 투표의 ID 목록
        List<Long> pollIds = polls.stream().map(Poll::getId).toList();

        // 6. 투표 선택지 일괄 조회
        List<PollOption> options = pollOptionRepository.findByPollIdInOrderByPollIdAscDisplayOrderAsc(pollIds);

        // 7. 투표 ID를 기준으로 선택지 그룹화
        Map<Long, List<PollOption>> optionsByPollId = options.stream().collect(Collectors.groupingBy(PollOption::getPollId));

        // 8. Poll + PollOption -> PollResponseDTO 변환
        return polls.stream().map(poll -> PollResponseDTO.from(poll, optionsByPollId.getOrDefault(poll.getId(), List.of()))).toList();
    }

    //11/10 추가
    // 참가 승인된 행사·세션의 전체 투표 목록 페이지 조회
    public Page<UserPollDTO> getUserPolls(Long userId, int page, int size) {

        // 1. 사용자 확인
        if (userId == null) {
            throw new ApiException(ErrorCode.UNAUTHORIZED);
        }

        // 2. 페이지 파라미터 검증
        if (page < 0 || size < 1 || size > 100) {
            throw new ApiException(ErrorCode.INVALID_REQUEST);
        }

        // 3. 현재 사용자가 참가 승인받은 세션 조회
        List<Long> sessionIds = eventClient.accessibleSessions(userId);


        // 4. 최신 투표부터 조회
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));

        // 5. 승인된 세션이 없다면 빈 페이지 반환
        if (sessionIds.isEmpty()) {
            return Page.empty(pageable);
        }

        // 6. DB 페이지 조회 및 목록 DTO 변환
        return pollRepository.findBySessionIdIn(sessionIds, pageable).map(UserPollDTO::from);
    }

    // 관리자가 투표를 수동으로 즉시 활성화
    public Long setPollActive(Long userId, Long pollId) {

        // 1. 투표 조회
        Poll poll = pollRepository.findById(pollId).orElseThrow(() -> new ApiException(ErrorCode.POLL_NOT_FOUND));

        // 2. 투표 생성자 검사
        if (!Objects.equals(poll.getUserId(), userId)) {
            throw new ApiException(ErrorCode.EVENT_OWNER_REQUIRED);
        }

        if (!eventClient.owner(poll.getEventId(), userId)) throw new ApiException(ErrorCode.EVENT_OWNER_REQUIRED);

        // 3. 서버의 현재 시각
        Instant now = Instant.now();

        // 4. 수동 활성화 가능 여부 확인
        if (!poll.canForceActivate(now)) {
            throw new ApiException(HttpStatus.CONFLICT, "INVALID_STATUS_CHANGE", "예정 상태이며 종료 시간이 지나지 않은 투표만 활성화할 수 있습니다.");
        }

        // 5. 시작 시각을 현재 시각으로 변경하고 ACTIVE 전환
        poll.forceActivate(now);

        // 6. 기존 WebSocket 상태 변경 알림
        eventPublisher.publishEvent(new PollStatusChangedEvent(poll.getId(), poll.getSessionId(), Status.ACTIVE));

        return poll.getId();
    }


    // 투표 비활성화(종료): 종료 후 재활성화는 허용하지 않음
    public Long setPollClose(Long userId, Long pollId) {
        Poll poll = pollRepository.findById(pollId).orElseThrow(() -> new ApiException(ErrorCode.POLL_NOT_FOUND));

        if (!Objects.equals(poll.getUserId(), userId)) {
            throw new ApiException(ErrorCode.EVENT_OWNER_REQUIRED);
        }

        if (!eventClient.owner(poll.getEventId(), userId)) throw new ApiException(ErrorCode.EVENT_OWNER_REQUIRED);

        // 투표 상태 전이 충돌
        if (!poll.canClose()) {
            throw new ApiException(HttpStatus.CONFLICT, "INVALID_STATUS_CHANGE", "진행 중인 투표만 종료할 수 있습니다.");
        }

        poll.close();

        //WebSocket 알림 연동 추가
        eventPublisher.publishEvent(new PollStatusChangedEvent(poll.getId(), poll.getSessionId(), Status.CLOSED));

        return pollId;
    }
}
