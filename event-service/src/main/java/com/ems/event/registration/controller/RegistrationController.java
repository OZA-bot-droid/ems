package com.ems.event.registration.controller;

import com.ems.event.registration.entity.Registration;
import com.ems.event.common.security.AdminChecker;
import com.ems.event.registration.service.RegistrationService;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/** 참가 신청 API입니다. 게이트웨이가 /api를 제거하므로 내부 경로는 /events로 시작합니다. */
@RestController
@RequestMapping("/events")
public class RegistrationController {

    private final RegistrationService registrationService;
    private final AdminChecker adminChecker;

    public RegistrationController(RegistrationService registrationService, AdminChecker adminChecker) {
        this.registrationService = registrationService;
        this.adminChecker = adminChecker;
    }

    /** 로그인한 사용자의 행사 참가 신청을 생성합니다. */
    @PostMapping("/{eventId}/registrations")
    public ResponseEntity<RegistrationSuccessResponse> apply(
            @PathVariable Long eventId,
            @RequestHeader(value = "X-Member-Id", required = false) Long memberId,
            HttpServletRequest request) {
        requireUser(memberId);
        Registration created = registrationService.apply(memberId, eventId);
        RegistrationSuccessResponse response = successResponse(
                created, "참가 신청이 완료되었습니다.", HttpStatus.CREATED.value(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /** 로그인한 사용자의 신청 목록을 페이지 단위로 반환합니다. */
    @GetMapping("/registrations/me")
    public Page<RegistrationResponse> mine(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestHeader(value = "X-Member-Id", required = false) Long memberId) {
        requireUser(memberId);
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100));
        return registrationService.findMine(memberId, pageable).map(RegistrationResponse::from);
    }

    /** 관리자만 신청을 승인할 수 있습니다. */
    @PatchMapping("/registrations/{registrationId}/approve")
    public RegistrationSuccessResponse approve(
            @PathVariable Long registrationId,
            @RequestHeader(value = "X-Member-Id", required = false) Long memberId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            HttpServletRequest request) {
        adminChecker.requireAdmin(memberId, role);
        Registration approved = registrationService.approve(registrationId, memberId);
        return successResponse(approved, "참가 신청이 승인되었습니다.", HttpStatus.OK.value(), request);
    }

    /** 관리자만 신청을 거절할 수 있습니다. */
    @PatchMapping("/registrations/{registrationId}/reject")
    public RegistrationSuccessResponse reject(
            @PathVariable Long registrationId,
            @RequestHeader(value = "X-Member-Id", required = false) Long memberId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            HttpServletRequest request) {
        adminChecker.requireAdmin(memberId, role);
        Registration rejected = registrationService.reject(registrationId, memberId);
        return successResponse(rejected, "참가 신청이 거절되었습니다.", HttpStatus.OK.value(), request);
    }

    /** 신청자 본인 또는 관리자가 신청을 취소합니다. */
    @PatchMapping("/registrations/{registrationId}/cancel")
    public RegistrationSuccessResponse cancel(
            @PathVariable Long registrationId,
            @RequestHeader(value = "X-Member-Id", required = false) Long requesterId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            HttpServletRequest request) {
        requireUser(requesterId);
        Registration cancelled = registrationService.cancel(
                registrationId, requesterId, adminChecker.isAdmin(role));
        return successResponse(cancelled, "참가 신청이 취소되었습니다.", HttpStatus.OK.value(), request);
    }

    /** 관리자에게 행사별 신청 상태 건수를 반환합니다. */
    @GetMapping("/{eventId}/summary")
    public RegistrationService.EventRegistrationSummary summary(
            @PathVariable Long eventId,
            @RequestHeader(value = "X-Member-Id", required = false) Long memberId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        adminChecker.requireAdmin(memberId, role);
        return registrationService.summarize(eventId);
    }

    /** Gateway가 전달한 Member Service의 BIGINT 회원 ID가 있어야 합니다. */
    private void requireUser(Long memberId) {
        if (memberId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
    }

    private RegistrationSuccessResponse successResponse(
            Registration registration, String message, int status, HttpServletRequest request) {
        String requestPath = request.getRequestURI();
        String externalPath = requestPath.startsWith("/api/") ? requestPath : "/api" + requestPath;
        return new RegistrationSuccessResponse(true, RegistrationResponse.from(registration), message,
                status, Instant.now(), externalPath, null);
    }

    /** 참가 신청·승인·취소 성공 시 반환하는 공통 응답입니다. */
    private record RegistrationSuccessResponse(
            boolean success, RegistrationResponse data, String message, int status,
            Instant timestamp, String path, String traceId) { }

    /** 프런트엔드에 전달할 신청 정보입니다. */
    private record RegistrationResponse(
            Long id, Long eventId, Long userId, String status,
            Instant requestedAt, Instant updatedAt, Instant decidedAt) {
        private static RegistrationResponse from(Registration registration) {
            return new RegistrationResponse(registration.getId(), registration.getEventId(),
                    registration.getUserId(), registration.getStatus().name(),
                    registration.getRequestedAt(), registration.getUpdatedAt(), registration.getDecidedAt());
        }
    }
}
