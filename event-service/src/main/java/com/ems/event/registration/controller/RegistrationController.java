package com.ems.event.registration.controller;

import com.ems.event.registration.entity.Registration;
import com.ems.event.registration.service.RegistrationService;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.UUID;
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

    public RegistrationController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    /** 로그인한 사용자의 행사 참가 신청을 생성합니다. */
    @PostMapping("/{eventId}/registrations")
    public ResponseEntity<RegistrationResponse> apply(
            @PathVariable Long eventId, HttpServletRequest request) {
        requireUser(request);
        Registration created = registrationService.apply(requireUser(request), eventId);
        return ResponseEntity.status(HttpStatus.CREATED).body(RegistrationResponse.from(created));
    }

    /** 로그인한 사용자의 신청 목록을 페이지 단위로 반환합니다. */
    @GetMapping("/registrations/me")
    public Page<RegistrationResponse> mine(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest request) {
        requireUser(request);
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100));
        return registrationService.findMine(requireUser(request), pageable).map(RegistrationResponse::from);
    }

    /** 관리자만 신청을 승인할 수 있습니다. */
    @PatchMapping("/registrations/{registrationId}/approve")
    public RegistrationResponse approve(
            @PathVariable Long registrationId, HttpServletRequest request) {
        requireAdmin(request);
        return RegistrationResponse.from(registrationService.approve(registrationId));
    }

    /** 관리자만 신청을 거절할 수 있습니다. */
    @PatchMapping("/registrations/{registrationId}/reject")
    public RegistrationResponse reject(
            @PathVariable Long registrationId, HttpServletRequest request) {
        requireAdmin(request);
        return RegistrationResponse.from(registrationService.reject(registrationId));
    }

    /** 신청자 본인 또는 관리자가 신청을 취소합니다. */
    @PatchMapping("/registrations/{registrationId}/cancel")
    public RegistrationResponse cancel(
            @PathVariable Long registrationId, HttpServletRequest request) {
        String requesterId = requireUser(request);
        return RegistrationResponse.from(registrationService.cancel(
                registrationId, requesterId, request.isUserInRole("ADMIN")));
    }

    /** 관리자에게 행사별 신청 상태 건수를 반환합니다. */
    @GetMapping("/{eventId}/summary")
    public RegistrationService.EventRegistrationSummary summary(
            @PathVariable Long eventId, HttpServletRequest request) {
        requireAdmin(request);
        return registrationService.summarize(eventId);
    }

    /** 인증 주체에서 사용자 UUID를 가져와 형식을 확인합니다. */
    private String requireUser(HttpServletRequest request) {
        if (request.getUserPrincipal() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        String userId = request.getUserPrincipal().getName();
        try {
            return UUID.fromString(userId).toString();
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "인증 사용자 ID가 UUID 형식이 아닙니다.", exception);
        }
    }

    /** 사용자 인증과 함께 ADMIN 역할도 확인합니다. */
    private void requireAdmin(HttpServletRequest request) {
        requireUser(request);
        if (!request.isUserInRole("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "관리자 권한이 필요합니다.");
        }
    }

    /** 프런트엔드에 전달할 신청 정보입니다. */
    private record RegistrationResponse(
            Long id, Long eventId, String userId, String status,
            Instant requestedAt, Instant updatedAt, Instant decidedAt) {
        private static RegistrationResponse from(Registration registration) {
            return new RegistrationResponse(registration.getId(), registration.getEventId(),
                    registration.getUserId(), registration.getStatus().name(),
                    registration.getRequestedAt(), registration.getUpdatedAt(), registration.getDecidedAt());
        }
    }
}
