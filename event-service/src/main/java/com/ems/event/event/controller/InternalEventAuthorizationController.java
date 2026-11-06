package com.ems.event.event.controller;

import com.ems.event.event.entity.Event;
import com.ems.event.event.repository.EventRepository;
import com.ems.event.registration.entity.RegistrationStatus;
import com.ems.event.registration.service.RegistrationService;
import com.ems.event.session.entity.Session;
import com.ems.event.session.repository.SessionRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/** Internal contract for Interaction. Requires X-Internal-Service-Token filter. */
@RestController
@RequestMapping("/internal/events")
public class InternalEventAuthorizationController {
    private final EventRepository eventRepository;
    private final SessionRepository sessionRepository;
    private final RegistrationService registrationService;

    public InternalEventAuthorizationController(EventRepository events, SessionRepository sessions,
                                                RegistrationService registrations) {
        this.eventRepository = events;
        this.sessionRepository = sessions;
        this.registrationService = registrations;
    }

    @GetMapping("/{eventId}/authorization/{memberId}")
    public EventAccess authorization(@PathVariable Long eventId, @PathVariable Long memberId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        return new EventAccess(eventId, event.isOwnedBy(memberId),
                registrationService.isApproved(eventId, memberId), event.getStatus().name());
    }

    @GetMapping("/{eventId}/sessions/{sessionId}")
    public SessionInfo session(@PathVariable Long eventId, @PathVariable Long sessionId) {
        Session session = sessionRepository.findByIdAndEventId(sessionId, eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));
        return new SessionInfo(sessionId, eventId, session.getStartsAt(), session.getEndsAt());
    }

    @GetMapping("/sessions/{sessionId}/authorization/{memberId}")
    public SessionAccess sessionAccess(@PathVariable Long sessionId, @PathVariable Long memberId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));
        Long eventId = session.getEvent().getId();
        EventAccess access = authorization(eventId, memberId);
        return new SessionAccess(sessionId, eventId, access.owner(), access.approved());
    }

    @GetMapping("/sessions/accessible/{memberId}")
    public List<Long> accessibleSessions(@PathVariable Long memberId) {
        return sessionRepository.findAccessibleSessionIds(memberId, RegistrationStatus.APPROVED);
    }

    public record EventAccess(Long eventId, boolean owner, boolean approved, String status) { }
    public record SessionInfo(Long sessionId, Long eventId, Instant startsAt, Instant endsAt) { }
    public record SessionAccess(Long sessionId, Long eventId, boolean owner, boolean approved) { }
}
