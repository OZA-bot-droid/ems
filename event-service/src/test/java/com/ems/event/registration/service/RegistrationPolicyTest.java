package com.ems.event.registration.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.ems.event.common.exception.BusinessException;
import com.ems.event.event.entity.Event;
import com.ems.event.event.entity.EventStatus;
import com.ems.event.event.repository.EventRepository;
import com.ems.event.registration.entity.Registration;
import com.ems.event.registration.entity.RegistrationStatus;
import com.ems.event.registration.repository.RegistrationRepository;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

class RegistrationPolicyTest {
    private RegistrationRepository registrations;
    private EventRepository events;
    private RegistrationService service;

    private Event event(EventStatus status) {
        Event event = new Event("세미나", "등록 정책", 10,
            Instant.now().plusSeconds(3600), Instant.now().plusSeconds(7200), null, 1L);
        event.update(null, null, null, null, null, null, status);
        return event;
    }

    @BeforeEach
    void setup() {
        registrations = mock(RegistrationRepository.class);
        events = mock(EventRepository.class);
        service = new RegistrationService(registrations, events);
    }

    private void assertError(BusinessException ex, HttpStatus status, String code) {
        assertEquals(status, ex.getStatus());
        assertEquals(code, ex.getCode());
    }

    @Test
    void draftAndClosedEventsRejectApplications() {
        for (EventStatus status : new EventStatus[]{EventStatus.DRAFT, EventStatus.CLOSED}) {
            when(events.findById(10L)).thenReturn(Optional.of(event(status)));
            BusinessException exception = assertThrows(BusinessException.class,
                () -> service.apply(99L, 10L));
            assertError(exception, HttpStatus.CONFLICT, "EVENT_NOT_OPEN");
        }
        verifyNoInteractions(registrations);
    }

    @Test
    void unknownEventReturns404WithoutInsertion() {
        when(events.findById(10L)).thenReturn(Optional.empty());
        BusinessException exception = assertThrows(BusinessException.class,
            () -> service.apply(99L, 10L));
        assertError(exception, HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND");
        verifyNoInteractions(registrations);
    }

    @Test
    void duplicateApplicationReturnsContractCode() {
        when(events.findById(10L)).thenReturn(Optional.of(event(EventStatus.OPEN)));
        when(registrations.existsByUserIdAndEventIdAndStatusNot(
                99L, 10L, RegistrationStatus.CANCELLED)).thenReturn(true);
        BusinessException exception = assertThrows(BusinessException.class,
            () -> service.apply(99L, 10L));
        assertError(exception, HttpStatus.CONFLICT, "ALREADY_REGISTERED");
        verify(registrations, never()).saveAndFlush(any());
    }

    @Test
    void otherEventAdminCannotCancelApplication() {
        Registration registration = new Registration(99L, 10L);
        when(registrations.findById(5L)).thenReturn(Optional.of(registration));
        when(events.findById(10L)).thenReturn(Optional.of(event(EventStatus.OPEN)));
        BusinessException exception = assertThrows(BusinessException.class,
            () -> service.cancel(5L, 2L, true));
        assertError(exception, HttpStatus.FORBIDDEN, "EVENT_OWNER_REQUIRED");
        assertEquals(RegistrationStatus.PENDING, registration.getStatus());
    }

    @Test
    void unrelatedUserCannotCancelApplication() {
        Registration registration = new Registration(99L, 10L);
        when(registrations.findById(5L)).thenReturn(Optional.of(registration));
        BusinessException exception = assertThrows(BusinessException.class,
            () -> service.cancel(5L, 2L, false));
        assertError(exception, HttpStatus.FORBIDDEN, "FORBIDDEN");
        verifyNoInteractions(events);
    }

    @Test
    void ownerCanCancelApplication() {
        Registration registration = new Registration(99L, 10L);
        when(registrations.findById(5L)).thenReturn(Optional.of(registration));
        when(events.findById(10L)).thenReturn(Optional.of(event(EventStatus.OPEN)));
        service.cancel(5L, 1L, true);
        assertEquals(RegistrationStatus.CANCELLED, registration.getStatus());
    }

    @Test
    void applicantCanCancelOwnApplication() {
        Registration registration = new Registration(99L, 10L);
        when(registrations.findById(5L)).thenReturn(Optional.of(registration));
        service.cancel(5L, 99L, false);
        assertEquals(RegistrationStatus.CANCELLED, registration.getStatus());
        verifyNoInteractions(events);
    }

    @Test
    void otherEventAdminCannotViewSummaryOrQueryCounts() {
        when(events.findById(10L)).thenReturn(Optional.of(event(EventStatus.OPEN)));
        BusinessException exception = assertThrows(BusinessException.class,
            () -> service.summarize(10L, 2L));
        assertError(exception, HttpStatus.FORBIDDEN, "EVENT_OWNER_REQUIRED");
        verifyNoInteractions(registrations);
    }

    @Test
    void ownerCanViewSummary() {
        when(events.findById(10L)).thenReturn(Optional.of(event(EventStatus.OPEN)));
        RegistrationService.EventRegistrationSummary summary = service.summarize(10L, 1L);
        assertEquals(10L, summary.eventId());
        verify(registrations, times(4)).countByEventIdAndStatus(eq(10L), any());
    }

    @Test
    void nonexistentSummaryReturns404() {
        when(events.findById(10L)).thenReturn(Optional.empty());
        BusinessException exception = assertThrows(BusinessException.class,
            () -> service.summarize(10L, 1L));
        assertError(exception, HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND");
        verifyNoInteractions(registrations);
    }
}
