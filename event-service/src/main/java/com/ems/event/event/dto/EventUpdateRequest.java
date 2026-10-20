package com.ems.event.event.dto;

import com.ems.event.event.EventStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.time.Instant;

/** PATCH /api/events/{eventId} 요청 본문. 보낸 필드만 수정한다 */
public record EventUpdateRequest(
        @Size(min = 1, max = 200) String title,
        @Size(max = 2000) String description,
        @Min(1) Integer capacity,
        Instant startsAt,
        Instant endsAt,
        EventStatus status
) {
}
