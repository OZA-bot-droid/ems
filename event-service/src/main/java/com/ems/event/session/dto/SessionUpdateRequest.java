package com.ems.event.session.dto;

import jakarta.validation.constraints.Size;
import java.time.Instant;

/** PATCH /api/events/{eventId}/sessions/{sessionId} 요청 본문. 보낸 필드만 수정한다 */
public record SessionUpdateRequest(
        @Size(min = 1, max = 200) String title,
        Instant startsAt,
        Instant endsAt,
        @Size(max = 500) String meetingUrl
) {
}
