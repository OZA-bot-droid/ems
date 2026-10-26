package com.ems.interaction.vote.controller;


import com.ems.interaction.vote.dto.PollVoteSaveDTO;
import com.ems.interaction.vote.service.PollVoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/interactions")
@RequiredArgsConstructor
public class PollVoteController {
    private final PollVoteService pollVoteService;

    // 투표 생성
    @PostMapping("/polls/{pollId}/votes")
    public ResponseEntity<?> createPollVote(@Valid @RequestBody PollVoteSaveDTO dto, @PathVariable Long pollId,@RequestHeader("X-Member-Id") Long userId) {


        return new ResponseEntity<>(pollVoteService.createVote(dto, pollId,userId), HttpStatus.CREATED);
    }

}
