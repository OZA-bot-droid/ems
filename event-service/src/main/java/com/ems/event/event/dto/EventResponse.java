package com.ems.event.event.dto;

import com.ems.event.event.Event;
import com.ems.event.event.EventStatus;
import java.time.Instant;
import java.util.UUID;

public record EventResponse(
        UUID id,
        String title,
        String description,
        int capacity,
        Instant startsAt,
        Instant endsAt,
        EventStatus status,
        UUID createdBy
) {
    public static EventResponse from(Event event) {
        return new EventResponse(
                event.getId(),
                event.getTitle(),
                event.getDescription(),
                event.getCapacity(),
                event.getStartsAt(),
                event.getEndsAt(),
                event.getStatus(),
                event.getCreatedBy());
    }
}
