package com.ems.interaction.poll.service;

import org.springframework.stereotype.Service;


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
            throw new IllegalArgumentException("투표 생성자 정보가 없습니다.");
        }

        // 투표 시작·종료 시간 검증
        if (!dto.getEndsAt().isAfter(dto.getStartsAt())) {
            throw new IllegalArgumentException("종료 시각은 시작 시각보다 늦어야 합니다.");
        }

        if (!dto.getStartsAt().isAfter(Instant.now())) {
            throw new IllegalArgumentException("시작 시각은 현재보다 미래여야 합니다.");
        }

        // 선택지 최소 2개 검증
        if (dto.getOptions() == null || dto.getOptions().size() < 2) {
            throw new IllegalArgumentException("선택지는 최소 2개 필요합니다.");
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

        Poll poll = pollRepository.findById(pollId).orElseThrow(() -> new IllegalArgumentException("존재하지 않는 투표입니다."));

        List<PollOption> options = pollOptionRepository.findByPollIdOrderByDisplayOrderAsc(pollId);

        return PollResponseDTO.from(poll, options);
    }
}