package com.ems.interaction.poll.controller;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ems.interaction.poll.dto.PollSaveDTO;
import com.ems.interaction.poll.dto.PollResponseDTO;
import com.ems.interaction.poll.service.PollService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;


@RestController
@RequestMapping("/interactions")
@RequiredArgsConstructor
public class PollController {

    private final PollService pollService;

    // 투표 생성
    @PostMapping("/polls")
    public ResponseEntity<?> createPoll(@Valid @RequestBody PollSaveDTO dto,
                                        @RequestHeader("X-Member-Id") Long userId,
                                        @RequestHeader("X-User-Role") String role) {
        checkAdmin(role);

        PollResponseDTO response = pollService.createPoll(dto, userId);

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // 투표 내용 상세 조회
    @GetMapping("/polls/{pollId}")
    public ResponseEntity<?> getPoll(@PathVariable Long pollId) {

        return new ResponseEntity<>(pollService.getPoll(pollId), HttpStatus.OK);
    }

    private void checkAdmin(String role) {

        if (!"ADMIN".equals(role)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "투표 생성 권한이 없습니다."
            );
        }
    }

}