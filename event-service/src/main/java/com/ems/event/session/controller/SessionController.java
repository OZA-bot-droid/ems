package com.ems.event.session.controller;

import com.ems.event.common.dto.ApiSuccessResponse;
import com.ems.event.common.security.AdminChecker;
import com.ems.event.session.service.SessionService;
import com.ems.event.session.dto.SessionCreateRequest;
import com.ems.event.session.dto.SessionResponse;
import com.ems.event.session.dto.SessionUpdateRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/events/{eventId}/sessions")
public class SessionController {

    private final SessionService sessionService;
    private final AdminChecker adminChecker;

    public SessionController(SessionService sessionService, AdminChecker adminChecker) {
        this.sessionService = sessionService;
        this.adminChecker = adminChecker;
    }

//    세션 목록 (누구나)
    @GetMapping
    public ApiSuccessResponse<List<SessionResponse>> getSessions(
            @PathVariable Long eventId,
            @RequestHeader(value = "X-Member-Id", required = false) Long memberId,
            HttpServletRequest httpRequest) {
        return ApiSuccessResponse.ok(sessionService.getSessions(eventId, memberId), "세션 목록 조회 성공", httpRequest);
    }

//    세션 생성 (ADMIN)
    @PostMapping
    public ResponseEntity<ApiSuccessResponse<SessionResponse>> createSession(
            @PathVariable Long eventId,
            @Valid @RequestBody SessionCreateRequest request,
            @RequestHeader(value = "X-Member-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            HttpServletRequest httpRequest) {
        adminChecker.requireAdmin(userId, role);
        SessionResponse created = sessionService.createSession(eventId, userId, request);
        return ResponseEntity
                .created(URI.create("/api/events/" + eventId + "/sessions/" + created.id()))
                .body(ApiSuccessResponse.created(created, "세션 생성 완료", httpRequest));
    }

//    세션 수정 (ADMIN)
    @PatchMapping("/{sessionId}")
    public ApiSuccessResponse<SessionResponse> updateSession(
            @PathVariable Long eventId,
            @PathVariable Long sessionId,
            @Valid @RequestBody SessionUpdateRequest request,
            @RequestHeader(value = "X-Member-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            HttpServletRequest httpRequest) {
        adminChecker.requireAdmin(userId, role);
        return ApiSuccessResponse.ok(sessionService.updateSession(eventId, sessionId, userId, request),
                "세션 수정 완료", httpRequest);
    }

//    세션 삭제 (ADMIN)
    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Void> deleteSession(
            @PathVariable Long eventId,
            @PathVariable Long sessionId,
            @RequestHeader(value = "X-Member-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        adminChecker.requireAdmin(userId, role);
        sessionService.deleteSession(eventId, sessionId, userId);
        return ResponseEntity.noContent().build();
    }
}
