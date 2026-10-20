package com.ems.event.event.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

/** POST /api/events 요청 본문. 시간은 UTC ISO-8601 (예: 2026-11-01T09:00:00Z) */
public record EventCreateRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 2000) String description,
        @NotNull @Min(1) Integer capacity,
        @NotNull Instant startsAt,
        @NotNull Instant endsAt
) {
}
