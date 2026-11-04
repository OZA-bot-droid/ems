package com.ems.event.registration.controller;

import com.ems.event.common.dto.ApiSuccessResponse;
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
    public ResponseEntity<ApiSuccessResponse<RegistrationResponse>> apply(
            @PathVariable Long eventId,
            @RequestHeader(value = "X-Member-Id", required = false) Long memberId,
            HttpServletRequest httpRequest) {
        requireUser(memberId);
        Registration created = registrationService.apply(memberId, eventId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiSuccessResponse.created(RegistrationResponse.from(created), "참가 신청이 완료되었습니다.", httpRequest));
    }

    /** 로그인한 사용자의 신청 목록을 페이지 단위로 반환합니다. */
    @GetMapping("/registrations/me")
    public ApiSuccessResponse<Page<RegistrationResponse>> mine(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestHeader(value = "X-Member-Id", required = false) Long memberId,
            HttpServletRequest httpRequest) {
        requireUser(memberId);
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100));
        return ApiSuccessResponse.ok(registrationService.findMine(memberId, pageable).map(RegistrationResponse::from),
                "신청 목록 조회 성공", httpRequest);
    }

    /** 관리자만 신청을 승인할 수 있습니다. */
    @PatchMapping("/registrations/{registrationId}/approve")
    public ApiSuccessResponse<RegistrationResponse> approve(
            @PathVariable Long registrationId,
            @RequestHeader(value = "X-Member-Id", required = false) Long memberId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            HttpServletRequest httpRequest) {
        adminChecker.requireAdmin(memberId, role);
        return ApiSuccessResponse.ok(RegistrationResponse.from(registrationService.approve(registrationId, memberId)),
                "참가 신청이 승인되었습니다.", httpRequest);
    }

    /** 관리자만 신청을 거절할 수 있습니다. */
    @PatchMapping("/registrations/{registrationId}/reject")
    public ApiSuccessResponse<RegistrationResponse> reject(
            @PathVariable Long registrationId,
            @RequestHeader(value = "X-Member-Id", required = false) Long memberId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            HttpServletRequest httpRequest) {
        adminChecker.requireAdmin(memberId, role);
        return ApiSuccessResponse.ok(RegistrationResponse.from(registrationService.reject(registrationId, memberId)),
                "참가 신청이 거절되었습니다.", httpRequest);
    }

    /** 신청자 본인 또는 관리자가 신청을 취소합니다. */
    @PatchMapping("/registrations/{registrationId}/cancel")
    public ApiSuccessResponse<RegistrationResponse> cancel(
            @PathVariable Long registrationId,
            @RequestHeader(value = "X-Member-Id", required = false) Long requesterId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            HttpServletRequest httpRequest) {
        requireUser(requesterId);
        return ApiSuccessResponse.ok(RegistrationResponse.from(registrationService.cancel(
                registrationId, requesterId, adminChecker.isAdmin(role))), "참가 신청이 취소되었습니다.", httpRequest);
    }

    /** 관리자에게 행사별 신청 상태 건수를 반환합니다. */
    @GetMapping("/{eventId}/summary")
    public ApiSuccessResponse<RegistrationService.EventRegistrationSummary> summary(
            @PathVariable Long eventId,
            @RequestHeader(value = "X-Member-Id", required = false) Long memberId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            HttpServletRequest httpRequest) {
        adminChecker.requireAdmin(memberId, role);
        return ApiSuccessResponse.ok(registrationService.summarize(eventId), "신청 현황 조회 성공", httpRequest);
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
