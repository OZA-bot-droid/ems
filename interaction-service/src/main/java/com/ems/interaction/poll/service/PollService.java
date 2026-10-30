package com.ems.interaction.poll.service;

import com.ems.interaction.common.exception.ApiException;
import com.ems.interaction.common.exception.ErrorCode;
import com.ems.interaction.poll.domain.Poll;
import com.ems.interaction.poll.domain.PollOption;
import com.ems.interaction.poll.domain.Status;
import com.ems.interaction.poll.dto.PollManagementDTO;
import com.ems.interaction.poll.dto.PollResponseDTO;
import com.ems.interaction.poll.dto.PollSaveDTO;
import com.ems.interaction.poll.repository.PollOptionRepository;
import com.ems.interaction.poll.repository.PollRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;


//    데모용 유저, 이벤트, 세션, 허가 데이터
import com.ems.interaction.mock.DemoData;


@Service
@Transactional
@RequiredArgsConstructor
public class PollService {

    private final PollRepository pollRepository;
    private final PollOptionRepository pollOptionRepository;

    //    데모용 유저, 이벤트, 세션, 허가 데이터
    private final DemoData demoData;

    // 투표 생성
    @Transactional
    public PollResponseDTO createPoll(PollSaveDTO dto, Long userId) {

        // 인증된 관리자 ID 검증
        if (userId == null) {
            throw new ApiException(ErrorCode.UNAUTHORIZED);
        }

        // 행사 조회
        DemoData.DemoEvent event = demoData.events.get(dto.getEventId());

        // 행사 존재 여부 확인
        if (event == null) {
            throw new ApiException(ErrorCode.RESOURCE_NOT_FOUND);
        }

        // 행사 생성자와 현재 투표 생성자 아이디 비교
        if (!event.createdBy().equals(userId)) {
            throw new ApiException(ErrorCode.EVENT_OWNER_REQUIRED);
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
    public PollResponseDTO getPoll(Long pollId) {

        Poll poll = pollRepository.findById(pollId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "POLL_NOT_FOUND", "투표를 찾을 수 없습니다."));

        List<PollOption> options = pollOptionRepository.findByPollIdOrderByDisplayOrderAsc(pollId);

        return PollResponseDTO.from(poll, options);
    }


    // 관리자가 생성한 투표 목록 조회(최신순)
    public List<PollManagementDTO> getMyCreatedPolls(Long userId) {

        Instant now = Instant.now();

        return pollRepository.findByUserIdOrderByIdDesc(userId)
                .stream()
                .map(poll -> PollManagementDTO.from(poll, now))
                .toList();
    }

    // 유저가 참여 중인 세션의 활성화 상태인 투표 목록 전달
    public List<PollResponseDTO> getActivePolls(Long userId){

        // 1. 데모 회원 존재 여부 확인
        if (userId == null || !demoData.members.containsKey(userId)) {
            throw new ApiException(
                    HttpStatus.NOT_FOUND,
                    "USER_NOT_FOUND",
                    "존재하지 않는 사용자입니다."
            );
        }

        // 2. 사용자가 참가 승인받은 세션 조회
        List<Long> sessionIds = demoData.registrations.stream()
                .filter(reg -> reg.userId().equals(userId))
                .filter(reg -> "APPROVED".equals(reg.status()))
                .map(DemoData.DemoRegistration::sessionId)
                .distinct()
                .toList();

        // 3. 승인된 세션이 없으면 빈 목록 반환
        if (sessionIds.isEmpty()) {
            return List.of();
        }

        // 4. 해당 세션에 속한 ACTIVE 투표 조회
        List<Poll> polls = pollRepository.findBySessionIdInAndStatus(
                sessionIds,
                Status.ACTIVE
        );

        if (polls.isEmpty()) {
            return List.of();
        }

        // 5. 조회한 투표의 ID 목록
        List<Long> pollIds = polls.stream()
                .map(Poll::getId)
                .toList();

        // 6. 투표 선택지 일괄 조회
        List<PollOption> options = pollOptionRepository
                .findByPollIdInOrderByPollIdAscDisplayOrderAsc(pollIds);

        // 7. 투표 ID를 기준으로 선택지 그룹화
        Map<Long, List<PollOption>> optionsByPollId =
                options.stream()
                        .collect(Collectors.groupingBy(
                                PollOption::getPollId
                        ));

        // 8. Poll + PollOption -> PollResponseDTO 변환
        return polls.stream().map(poll -> PollResponseDTO.from(poll, optionsByPollId.getOrDefault(poll.getId(), List.of()))).toList();
    }


    // 투표 활성화: 예정 상태에서만, 실제 투표 가능 시간에만 전환
    public Long setPollActive(Long userId, Long pollId) {
        Poll poll = pollRepository.findById(pollId)
                .orElseThrow(() -> new ApiException(ErrorCode.POLL_NOT_FOUND));

        if (!Objects.equals(poll.getUserId(), userId)) {
            throw new ApiException(ErrorCode.EVENT_OWNER_REQUIRED);
        }

        // 투표 상태 전이 충돌 에러
        if (poll.getStatus() != Status.SCHEDULED) {
            throw new ApiException(HttpStatus.CONFLICT, "INVALID_STATUS_CHANGE", "예정 상태의 투표만 활성화할 수 있습니다.");
        }

        // 투표 상태 전이 충돌
        // 기존의 투표 조회 및 생성자 검증 이후
        if (!poll.canActivate(Instant.now())) {
            throw new ApiException(HttpStatus.CONFLICT, "INVALID_STATUS_CHANGE", "현재 활성화할 수 없는 투표입니다.");
        }

        poll.activate();
        return pollId;
    }

    // 투표 비활성화(종료): 종료 후 재활성화는 허용하지 않음
    public Long setPollClose(Long userId, Long pollId) {
        Poll poll = pollRepository.findById(pollId)
                .orElseThrow(() -> new ApiException(ErrorCode.POLL_NOT_FOUND));

        if (!Objects.equals(poll.getUserId(), userId)) {
            throw new ApiException(ErrorCode.EVENT_OWNER_REQUIRED);
        }

        // 투표 상태 전이 충돌
        if (!poll.canClose()) {
            throw new ApiException(HttpStatus.CONFLICT, "INVALID_STATUS_CHANGE", "진행 중인 투표만 종료할 수 있습니다.");
        }

        poll.close();
        return pollId;
    }
}
