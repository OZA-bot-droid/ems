package com.ems.interaction.poll.controller;

import com.ems.interaction.common.event.EventAuthorizationClient;
import com.ems.interaction.common.response.ApiResponseBuilder;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/interactions")
@RequiredArgsConstructor
public class PollStatusSubscriptionController {
    private final EventAuthorizationClient eventClient;
    private final ApiResponseBuilder apiResponseBuilder;

    @GetMapping("/polls/status-subscriptions")
    public ResponseEntity<?> getStatusSubscriptions(@RequestHeader("X-Member-Id") Long userId,
                                                     HttpServletRequest request) {
        List<Long> sessionIds = eventClient.accessibleSessions(userId);
        return apiResponseBuilder.ok(sessionIds, "구독 가능 세션 조회 성공", request);
    }
}
