package com.ems.event.event;

import com.ems.event.common.PageResponse;
import com.ems.event.event.dto.EventCreateRequest;
import com.ems.event.event.dto.EventResponse;
import com.ems.event.event.dto.EventUpdateRequest;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("http://localhost:5173/events")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }


    @GetMapping
    public PageResponse<EventResponse> getEvents(
            @RequestParam(required = false) EventStatus status,
            @PageableDefault(sort = "startsAt", direction = Sort.Direction.ASC) Pageable pageable) {
        return eventService.getEvents(status, pageable);
    }


    @GetMapping("/{eventId}")
    public EventResponse getEvent(@PathVariable UUID eventId) {
        return eventService.getEvent(eventId);
    }

//   생성
    @PostMapping("http://localhost:5173/admin/create/{eventId}")
    public ResponseEntity<EventResponse> createEvent(
            @Valid @RequestBody EventCreateRequest request,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {
        EventResponse created = eventService.createEvent(request, userId);
        return ResponseEntity.created(URI.create("/api/events/" + created.id())).body(created);
    }

//  수정
    @PatchMapping("http://localhost:5173/admin/event/{eventId}")
    public EventResponse updateEvent(
            @PathVariable UUID eventId,
            @Valid @RequestBody EventUpdateRequest request) {
        return eventService.updateEvent(eventId, request);
    }

//  삭제
    @DeleteMapping("http://localhost:5173/admin/{eventId}")
    public ResponseEntity<Void> deleteEvent(@PathVariable UUID eventId) {
        eventService.deleteEvent(eventId);
        return ResponseEntity.noContent().build();
    }
}
