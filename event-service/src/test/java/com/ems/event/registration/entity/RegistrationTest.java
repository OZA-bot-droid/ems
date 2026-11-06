package com.ems.event.registration.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class RegistrationTest {

    @Test
    void newRegistrationStartsPendingAndKeepsMemberId() {
        Long eventId = 101L;
        Long memberId = 222L;
        Registration registration = new Registration(memberId, eventId);

        assertEquals(eventId, registration.getEventId());
        assertEquals(memberId, registration.getUserId());
        assertEquals(RegistrationStatus.PENDING, registration.getStatus());
    }

    @Test
    void approveChangesPendingRegistrationAndRecordsDecisionTime() {
        Registration registration = newRegistration();

        registration.approve();

        assertEquals(RegistrationStatus.APPROVED, registration.getStatus());
        assertNotNull(registration.getDecidedAt());
    }

    @Test
    void rejectChangesPendingRegistrationAndRecordsDecisionTime() {
        Registration registration = newRegistration();

        registration.reject();

        assertEquals(RegistrationStatus.REJECTED, registration.getStatus());
        assertNotNull(registration.getDecidedAt());
    }

    @Test
    void cancelChangesPendingRegistrationAndRecordsDecisionTime() {
        Registration registration = newRegistration();

        registration.cancel();

        assertEquals(RegistrationStatus.CANCELLED, registration.getStatus());
        assertNotNull(registration.getDecidedAt());
    }

    @Test
    void cannotApproveOrRejectAfterLeavingPendingState() {
        Registration registration = newRegistration();
        registration.cancel();

        assertThrows(IllegalStateException.class, registration::approve);
        assertThrows(IllegalStateException.class, registration::reject);
    }

    private Registration newRegistration() {
        return new Registration(222L, 101L);
    }
}

