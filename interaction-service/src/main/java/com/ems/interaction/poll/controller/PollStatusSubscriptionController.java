package com.ems.interaction.poll.controller;


import com.ems.interaction.common.response.ApiResponseBuilder;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;

//데모용 데이터
import com.ems.interaction.mock.DemoData;

@RestController
@RequestMapping("/interactions")
@RequiredArgsConstructor
public class PollStatusSubscriptionController {

    private final DemoData demoData;
    private final ApiResponseBuilder apiResponseBuilder;

    @GetMapping("/polls/status-subscriptions")
    public ResponseEntity<?> getStatusSubscriptions(@RequestHeader("X-Member-Id") Long userId, HttpServletRequest request) {

        // 로컬 DemoData 사용자 검사
        if (!demoData.members.containsKey(userId)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "존재하지 않는 사용자입니다.");
        }

        // 사용자가 참가 승인받은 세션
        List<Long> registeredSessionIds = demoData.registrations.stream()
                .filter(reg -> Objects.equals(reg.userId(), userId))
                .filter(reg -> "APPROVED".equals(reg.status()))
                .map(DemoData.DemoRegistration::sessionId).toList();

        // 사용자가 생성한 행사의 세션
        List<Long> ownedSessionIds = demoData.sessions.values().stream().filter(session -> {
            DemoData.DemoEvent event = demoData.events.get(session.eventId());

            return event != null && Objects.equals(event.createdBy(), userId);
        }).map(DemoData.DemoSession::id).toList();

        // 중복 제거 후 리스트화
        List<Long> sessionIds = java.util.stream.Stream.concat(registeredSessionIds.stream(), ownedSessionIds.stream()).distinct().sorted().toList();

        return apiResponseBuilder.ok(sessionIds, "구독 가능 세션 조회 성공", request);
    }
}
