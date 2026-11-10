package com.ems.interaction.poll.controller;

import com.ems.interaction.common.exception.ApiException;
import com.ems.interaction.common.exception.ErrorCode;
import com.ems.interaction.common.response.PageResponse;
import com.ems.interaction.poll.dto.PollManagementDTO;
import com.ems.interaction.poll.dto.UserPollDTO;
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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;
import com.ems.interaction.common.response.ApiResponseBuilder;
import org.springframework.data.domain.Page;


@RestController
@RequestMapping("/interactions")
@RequiredArgsConstructor
public class PollController {

    private final PollService pollService;
    private final ApiResponseBuilder apiResponseBuilder;

    // 투표 생성
    @PostMapping("/polls")
    public ResponseEntity<?> createPoll(@Valid @RequestBody PollSaveDTO dto, @RequestHeader("X-Member-Id") Long userId, @RequestHeader("X-User-Role") String role, HttpServletRequest request) {
        checkAdmin(role);

        PollResponseDTO response = pollService.createPoll(dto, userId);

        String resourcePath = "/api/interactions/polls/" + response.getId();

        return apiResponseBuilder.created(response, "투표 생성 완료", resourcePath, request);
    }

    // 투표 내용 상세 조회
    @GetMapping("/polls/{pollId}")
    public ResponseEntity<?> getPoll(@PathVariable Long pollId, @RequestHeader("X-Member-Id") Long memberId, HttpServletRequest request) {

        PollResponseDTO response = pollService.getPoll(pollId, memberId);

        return apiResponseBuilder.ok(response, "투표 조회 성공", request);
    }

//
//    // 관리자가 생성한 투표 조회
//    @GetMapping("/polls/mycreated")
//    public ResponseEntity<?> getMyCreatedPolls(@RequestHeader("X-Member-Id") Long userId, @RequestHeader("X-User-Role") String role, HttpServletRequest request) {
//        checkAdmin(role);
//
//        List<PollManagementDTO> response = pollService.getMyCreatedPolls(userId);
//
//        return apiResponseBuilder.ok(response, "관리자 투표 목록 조회 성공", request);
//    }

    // 관리자가 생성한 투표 목록 페이지 조회
    @GetMapping("/polls/mycreated")
    public ResponseEntity<?> getMyCreatedPolls(@RequestHeader("X-Member-Id") Long userId, @RequestHeader("X-User-Role") String role,
                                               @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size,
                                               @RequestParam(required = false) Long eventId, @RequestParam(required = false) Long sessionId,
                                               HttpServletRequest request) {
        checkAdmin(role);

        Page<PollManagementDTO> response = pollService.getMyCreatedPolls(userId, page, size, eventId, sessionId);

        return apiResponseBuilder.ok(PageResponse.from(response), "관리자 투표 목록 조회 성공", request);
    }

    // 유저가 참여 중인 세션의 활성화 상태인 투표 목록 전달
    @GetMapping("/polls/getpolls")
    public ResponseEntity<?> getActivePolls(@RequestHeader("X-Member-Id") Long userId, @RequestHeader("X-User-Role") String role, HttpServletRequest request) {

        List<PollResponseDTO> response = pollService.getActivePolls(userId);

        return apiResponseBuilder.ok(response, "Active 투표 목록 조회 성공", request);
    }


    // 투표 활성화
    @PatchMapping("/polls/{pollId}/activate")
    public ResponseEntity<?> pollActive(@PathVariable Long pollId, @RequestHeader("X-Member-Id") Long userId, @RequestHeader("X-User-Role") String role, HttpServletRequest request) {
        checkAdmin(role);

        Long pollIdResult = pollService.setPollActive(userId, pollId);

        return apiResponseBuilder.ok(Map.of("pollId", pollIdResult), "투표 활성화 성공", request);
    }

    // 투표 종료
    @PatchMapping("/polls/{pollId}/close")
    public ResponseEntity<?> pollClose(@PathVariable Long pollId, @RequestHeader("X-Member-Id") Long userId, @RequestHeader("X-User-Role") String role, HttpServletRequest request) {
        checkAdmin(role);

        Long pollIdResult = pollService.setPollClose(userId, pollId);

        return apiResponseBuilder.ok(Map.of("pollId", pollIdResult), "투표 종료 성공", request);
    }


    // 참가 승인된 세션의 전체 투표 목록 페이지 조회
    @GetMapping("/polls/users")
    public ResponseEntity<?> getUserPolls(@RequestHeader("X-Member-Id") Long userId,
                                          @RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "10") int size, HttpServletRequest request) {

        Page<UserPollDTO> response = pollService.getUserPolls(userId, page, size);

        return apiResponseBuilder.ok(PageResponse.from(response), "참가 승인된 세션의 투표 목록 조회 성공", request);
    }


    //관리자 권한 체크
    private void checkAdmin(String role) {
        if (!"ADMIN".equals(role)) {
            throw new ApiException(ErrorCode.FORBIDDEN);
        }
    }

}