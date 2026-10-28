package com.ems.interaction.poll.service;

import com.ems.interaction.poll.dto.PollManagementDTO;
import com.ems.interaction.common.exception.ApiException;
import com.ems.interaction.poll.domain.Poll;
import com.ems.interaction.poll.domain.PollOption;
import com.ems.interaction.poll.dto.PollSaveDTO;
import com.ems.interaction.poll.dto.PollResponseDTO;
import com.ems.interaction.poll.repository.PollRepository;
import com.ems.interaction.poll.repository.PollOptionRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import com.ems.interaction.poll.domain.Status;

@Service
@Transactional
@RequiredArgsConstructor
public class PollService {

    private final PollRepository pollRepository;
    private final PollOptionRepository pollOptionRepository;

    // 투표 생성
    @Transactional
    public PollResponseDTO createPoll(PollSaveDTO dto, Long userId) {

        // 인증된 관리자 ID 검증
        if (userId == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "인증이 필요합니다.");
        }

        // 투표 시작·종료 시간 검증
        if (!dto.getEndsAt().isAfter(dto.getStartsAt())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PERIOD", "종료 시각은 시작 시각보다 늦어야 합니다.");
        }

        if (!dto.getStartsAt().isAfter(Instant.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PERIOD", "시작 시각은 현재보다 미래여야 합니다.");
        }

        // 선택지 최소 2개 검증
        if (dto.getOptions() == null || dto.getOptions().size() < 2) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "선택지는 최소 2개 필요합니다.");
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

    // 투표 활성화: 예정 상태에서만, 실제 투표 가능 시간에만 전환
    public Long setPollActive(Long userId, Long pollId) {
        Poll poll = pollRepository.findById(pollId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "POLL_NOT_FOUND", "투표를 찾을 수 없습니다."));

        if (!Objects.equals(poll.getUserId(), userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "투표를 변경할 권한이 없습니다.");
        }

        if (poll.getStatus() != Status.SCHEDULED) {
            throw new ApiException(HttpStatus.CONFLICT, "INVALID_STATUS_CHANGE", "예정 상태의 투표만 활성화할 수 있습니다.");
        }

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
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "POLL_NOT_FOUND", "투표를 찾을 수 없습니다."));

        if (!Objects.equals(poll.getUserId(), userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "투표를 변경할 권한이 없습니다.");
        }

        if (!poll.canClose()) {
            throw new ApiException(HttpStatus.CONFLICT, "INVALID_STATUS_CHANGE", "진행 중인 투표만 종료할 수 있습니다.");
        }

        poll.close();
        return pollId;
    }
}
