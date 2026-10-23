package com.ems.event.event.dto;

import com.ems.event.event.Event;
import com.ems.event.event.EventStatus;
import java.time.Instant;

public record EventResponse(
        Long id,
        String title,
        String description,
        int capacity,
        Instant startsAt,
        Instant endsAt,
        EventStatus status,
        String meetingUrl,
        Long createdBy
) {
    public static EventResponse from(Event event) {
        return from(event, true);
    }

    /**
     * @param showMeetingUrl false면 화상 회의 링크를 숨긴다 (null)
     *                       TODO: 승인된 참가자에게도 공개 (이도형 참가 신청 연동 후)
     */
    public static EventResponse from(Event event, boolean showMeetingUrl) {
        return new EventResponse(
                event.getId(),
                event.getTitle(),
                event.getDescription(),
                event.getCapacity(),
                event.getStartsAt(),
                event.getEndsAt(),
                event.getStatus(),
                showMeetingUrl ? event.getMeetingUrl() : null,
                event.getCreatedBy());
    }
}
