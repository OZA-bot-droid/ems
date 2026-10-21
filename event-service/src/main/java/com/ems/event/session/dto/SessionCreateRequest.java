package com.ems.event.session.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

/** POST /api/events/{eventId}/sessions 요청 본문. 시간은 UTC ISO-8601 (예: 2026-11-01T05:00:00Z) */
public record SessionCreateRequest(
        @NotBlank @Size(max = 200) String title,
        @NotNull Instant startsAt,
        @NotNull Instant endsAt,
        @Size(max = 500) String meetingUrl
) {
}
