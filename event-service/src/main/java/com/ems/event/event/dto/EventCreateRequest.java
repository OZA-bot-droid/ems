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
        @Size(max = 500) String meetingUrl,
        Instant postedDate // 게시 예약 시각 (선택). 이 시각이 되면 DRAFT → OPEN 자동 공개
) {
    /** 게시 예약 없이 만들 때 (기존 코드·테스트 호환용) */
    public EventCreateRequest(String title, String description, Integer capacity,
                              Instant startsAt, Instant endsAt, String meetingUrl) {
        this(title, description, capacity, startsAt, endsAt, meetingUrl, null);
    }
}
