package com.ems.interaction.poll.repository;

import com.ems.interaction.poll.domain.PollOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface PollOptionRepository
        extends JpaRepository<PollOption, Long> {

    // 선택지를 표시 순서대로 조회
    List<PollOption> findByPollIdOrderByDisplayOrderAsc(Long pollId);

    // 선택지가 존재하는지 확인
    boolean existsByPollIdAndId(Long pollId, Long id);

    // 여러 투표의 선택지를 한 번에 조회
    List<PollOption> findByPollIdInOrderByPollIdAscDisplayOrderAsc(Collection<Long> pollIds);
}