package com.ems.event.event.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;


public record EventCreateRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 2000) String description,
        @NotNull @Min(1) Integer capacity,
        @NotNull Instant startsAt,
        @NotNull Instant endsAt,
        @Size(max = 500) String meetingUrl
) {
}
