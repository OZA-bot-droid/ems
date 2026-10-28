package com.ems.interaction.poll.controller;

import com.ems.interaction.common.exception.ApiException;
import com.ems.interaction.poll.dto.PollManagementDTO;
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

import java.util.List;


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


    // 관리자가 생성한 투표 조회
    @GetMapping("/polls/mycreated")
    public ResponseEntity<?> getMyCreatedPolls(@RequestHeader("X-Member-Id") Long userId,
                                                @RequestHeader("X-User-Role") String role) {
        checkAdmin(role);

        List<PollManagementDTO> response = pollService.getMyCreatedPolls(userId);

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    // 투표 활성화
    @PatchMapping("/polls/active/{pollId}")
    public ResponseEntity<?> pollActive(@PathVariable Long pollId,
                                        @RequestHeader("X-Member-Id") Long userId,
                                        @RequestHeader("X-User-Role") String role){
        checkAdmin(role);

        return new ResponseEntity<>(pollService.setPollActive(userId, pollId), HttpStatus.OK);
    }

    // 투표 종료
    @PatchMapping("/polls/close/{pollId}")
    public ResponseEntity<?> pollClose(@PathVariable Long pollId,
                                        @RequestHeader("X-Member-Id") Long userId,
                                        @RequestHeader("X-User-Role") String role){
        checkAdmin(role);

        return new ResponseEntity<>(pollService.setPollClose(userId, pollId), HttpStatus.OK);
    }


    private void checkAdmin(String role) {
        if (!"ADMIN".equals(role)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "관리자 권한이 필요합니다.");
        }
    }

}