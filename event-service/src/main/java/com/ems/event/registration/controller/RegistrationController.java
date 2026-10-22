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

@RestController
@RequestMapping("/api/events")
public class RegistrationController {

    private final RegistrationService registrationService;

    public RegistrationController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @PostMapping("/{eventId}/registrations")
    public ResponseEntity<RegistrationResponse> apply(
            @PathVariable Long eventId, HttpServletRequest request) {
        requireUser(request);
        Registration created = registrationService.apply(requireUser(request), eventId);
        return ResponseEntity.status(HttpStatus.CREATED).body(RegistrationResponse.from(created));
    }

    @GetMapping("/registrations/me")
    public Page<RegistrationResponse> mine(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest request) {
        requireUser(request);
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100));
        return registrationService.findMine(requireUser(request), pageable).map(RegistrationResponse::from);
    }

    @PatchMapping("/registrations/{registrationId}/approve")
    public RegistrationResponse approve(
            @PathVariable Long registrationId, HttpServletRequest request) {
        requireAdmin(request);
        return RegistrationResponse.from(registrationService.approve(registrationId));
    }

    @PatchMapping("/registrations/{registrationId}/reject")
    public RegistrationResponse reject(
            @PathVariable Long registrationId, HttpServletRequest request) {
        requireAdmin(request);
        return RegistrationResponse.from(registrationService.reject(registrationId));
    }

    @PatchMapping("/registrations/{registrationId}/cancel")
    public RegistrationResponse cancel(
            @PathVariable Long registrationId, HttpServletRequest request) {
        String requesterId = requireUser(request);
        return RegistrationResponse.from(registrationService.cancel(
                registrationId, requesterId, request.isUserInRole("ADMIN")));
    }

    @GetMapping("/{eventId}/summary")
    public RegistrationService.EventRegistrationSummary summary(
            @PathVariable Long eventId, HttpServletRequest request) {
        requireAdmin(request);
        return registrationService.summarize(eventId);
    }

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

    private void requireAdmin(HttpServletRequest request) {
        requireUser(request);
        if (!request.isUserInRole("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "관리자 권한이 필요합니다.");
        }
    }

    private record RegistrationResponse(
            Long id, Long eventId, String userId, String status,
            Instant createdAt, Instant updatedAt, Instant decidedAt) {
        private static RegistrationResponse from(Registration registration) {
            return new RegistrationResponse(registration.getId(), registration.getEventId(),
                    registration.getUserId(), registration.getStatus().name(),
                    registration.getCreatedAt(), registration.getUpdatedAt(), registration.getDecidedAt());
        }
    }
}

