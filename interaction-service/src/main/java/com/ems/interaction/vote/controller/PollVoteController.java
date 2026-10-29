package com.ems.interaction.vote.controller;


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

@RestController
@RequestMapping("/interactions")
@RequiredArgsConstructor
public class PollVoteController {
    private final PollVoteService pollVoteService;

    // 투표하기 기능
    @PostMapping("/polls/{pollId}/votes")
    public ResponseEntity<?> createPollVote(@Valid @RequestBody PollVoteSaveDTO dto, @PathVariable Long pollId, @RequestHeader("X-Member-Id") Long userId) {


        return new ResponseEntity<>(pollVoteService.createVote(dto, pollId, userId), HttpStatus.CREATED);
    }

    // 활성화 상태인 투표의 유저의 투표 기록 조회
    @GetMapping("/polls/getactivevotes")
    public ResponseEntity<?> getActivePollVotes(@RequestHeader("X-Member-Id") Long userId,
                                                @RequestParam("pollIds") List<Long> pollIds) {

        List<PollVoteResultDTO> response = pollVoteService.getActivePollVotes(userId, pollIds);

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    // 투표 결과 조회 (권한 보유자만)
    @GetMapping("/polls/{pollId}/results")
    public ResponseEntity<PollResultDTO> getPollResults(
            @PathVariable Long pollId,
            @RequestHeader("X-Member-Id") Long userId) {

        PollResultDTO response =
                pollVoteService.getPollResults(pollId, userId);

        return ResponseEntity.ok(response);
    }
}
