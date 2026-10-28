package com.ems.event.registration.controller;

import com.ems.event.registration.entity.Registration;
import com.ems.event.common.AdminChecker;
import com.ems.event.registration.service.RegistrationService;
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
    public ResponseEntity<RegistrationResponse> apply(
            @PathVariable Long eventId,
            @RequestHeader(value = "X-Member-Id", required = false) Long memberId) {
        requireUser(memberId);
        Registration created = registrationService.apply(memberId, eventId);
        return ResponseEntity.status(HttpStatus.CREATED).body(RegistrationResponse.from(created));
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
    public RegistrationResponse approve(
            @PathVariable Long registrationId,
            @RequestHeader(value = "X-Member-Id", required = false) Long memberId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        adminChecker.requireAdmin(memberId, role);
        return RegistrationResponse.from(registrationService.approve(registrationId, memberId));
    }

    /** 관리자만 신청을 거절할 수 있습니다. */
    @PatchMapping("/registrations/{registrationId}/reject")
    public RegistrationResponse reject(
            @PathVariable Long registrationId,
            @RequestHeader(value = "X-Member-Id", required = false) Long memberId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        adminChecker.requireAdmin(memberId, role);
        return RegistrationResponse.from(registrationService.reject(registrationId, memberId));
    }

    /** 신청자 본인 또는 관리자가 신청을 취소합니다. */
    @PatchMapping("/registrations/{registrationId}/cancel")
    public RegistrationResponse cancel(
            @PathVariable Long registrationId,
            @RequestHeader(value = "X-Member-Id", required = false) Long requesterId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        requireUser(requesterId);
        return RegistrationResponse.from(registrationService.cancel(
                registrationId, requesterId, adminChecker.isAdmin(role)));
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
