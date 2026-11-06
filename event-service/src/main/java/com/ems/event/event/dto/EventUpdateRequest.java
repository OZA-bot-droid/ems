package com.ems.event.event.dto;

import com.ems.event.event.entity.EventStatus;
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
        @Size(max = 500) String meetingUrl,
        EventStatus status,
        Instant postedDate // 게시 예약 시각 변경 (작성 중일 때만)
) {
    /** 게시 예약을 바꾸지 않을 때 (기존 코드·테스트 호환용) */
    public EventUpdateRequest(String title, String description, Integer capacity,
                              Instant startsAt, Instant endsAt, String meetingUrl, EventStatus status) {
        this(title, description, capacity, startsAt, endsAt, meetingUrl, status, null);
    }
}
