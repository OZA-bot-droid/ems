package com.ems.event.session.dto;

import com.ems.event.session.Session;
import java.time.Instant;

public record SessionResponse(
        Long id,
        Long eventId,
        String title,
        Instant startsAt,
        Instant endsAt
) {
    public static SessionResponse from(Session session) {
        return new SessionResponse(
                session.getId(),
                session.getEvent().getId(),
                session.getTitle(),
                session.getStartsAt(),
                session.getEndsAt());
    }
}
