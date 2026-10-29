package com.ems.event.registration.controller;

import com.ems.event.registration.service.RegistrationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Interaction Service 전용 참가 승인 조회 API입니다. */
@RestController
@RequestMapping("/internal/events")
public class InternalRegistrationController {

    private final RegistrationService registrationService;

    public InternalRegistrationController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @GetMapping("/{eventId}/registrations/{memberId}")
    public ApprovalResponse checkApproval(
            @PathVariable Long eventId,
            @PathVariable Long memberId) {
        return new ApprovalResponse(registrationService.isApproved(eventId, memberId));
    }

    private record ApprovalResponse(boolean approved) { }
}