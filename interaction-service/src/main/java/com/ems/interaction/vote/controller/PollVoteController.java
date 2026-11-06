package com.ems.interaction.vote.controller;


import com.ems.interaction.vote.domain.PollVote;
import com.ems.interaction.vote.dto.PollResultDTO;
import com.ems.interaction.vote.dto.PollVoteResultDTO;
import com.ems.interaction.vote.dto.PollVoteSaveDTO;
import com.ems.interaction.vote.service.PollVoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;
import com.ems.interaction.common.response.ApiResponseBuilder;


@RestController
@RequestMapping("/interactions")
@RequiredArgsConstructor
public class PollVoteController {
    private final PollVoteService pollVoteService;
    private final ApiResponseBuilder apiResponseBuilder;

    // 투표하기 기능
    @PostMapping("/polls/{pollId}/votes")
    public ResponseEntity<?> createPollVote(@Valid @RequestBody PollVoteSaveDTO dto, @PathVariable Long pollId,
                                            @RequestHeader("X-Member-Id") Long userId, HttpServletRequest request) {
        PollVote savedVote = pollVoteService.createVote(dto, pollId, userId);

        String resourcePath = "/api/interactions/polls/" + pollId + "/votes";
        return apiResponseBuilder.created(Map.of("id", savedVote.getId().toString()), "투표 참여 완료", resourcePath, request);
    }

    // 활성화 상태인 투표의 유저의 투표 기록 조회
    @GetMapping("/polls/getactivevotes")
    public ResponseEntity<?> getActivePollVotes(@RequestHeader("X-Member-Id") Long userId,
                                                @RequestParam("pollIds") List<Long> pollIds,
                                                HttpServletRequest request) {

        List<PollVoteResultDTO> response = pollVoteService.getActivePollVotes(userId, pollIds);

        return apiResponseBuilder.ok(response, "사용자 투표 기록 완료", request);
    }

    // 투표 결과 조회 (권한 보유자만)
    @GetMapping("/polls/{pollId}/results")
    public ResponseEntity<?> getPollResults(@PathVariable Long pollId,
                                                        @RequestHeader("X-Member-Id") Long userId,
                                                        HttpServletRequest request) {

        PollResultDTO response = pollVoteService.getPollResults(pollId, userId);

        return apiResponseBuilder.ok(response, "투표 결과 조회 완료", request);
    }
}
