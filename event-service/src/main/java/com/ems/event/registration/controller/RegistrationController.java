
package com.ems.event.registration.controller;

import com.ems.event.registration.service.RegistrationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/events/registrations")
public class RegistrationController {

    private final RegistrationService registrationService;

    public RegistrationController(
            RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    // 신청 승인
    @PatchMapping("/{registrationId}/approve")
    public ResponseEntity<Void> approve(
            @PathVariable Long registrationId) {
        registrationService.approve(registrationId);
        return ResponseEntity.noContent().build();
    }

    // 신청 거절
    @PatchMapping("/{registrationId}/reject")
    public ResponseEntity<Void> reject(
            @PathVariable Long registrationId) {
        registrationService.reject(registrationId);
        return ResponseEntity.noContent().build();
    }

    // 신청 취소
    @PatchMapping("/{registrationId}/cancel")
    public ResponseEntity<Void> cancel(
            @PathVariable Long registrationId) {
        registrationService.cancel(registrationId);
        return ResponseEntity.noContent().build();
    }
}
