package com.ems.event.event;

import com.ems.event.common.AdminChecker;
import com.ems.event.common.PageResponse;
import com.ems.event.event.dto.EventCreateRequest;
import com.ems.event.event.dto.EventResponse;
import com.ems.event.event.dto.EventUpdateRequest;
import jakarta.validation.Valid;
import java.net.URI;
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
@RequestMapping("/events")
public class EventController {

    private final EventService eventService;
    private final AdminChecker adminChecker;

    public EventController(EventService eventService, AdminChecker adminChecker) {
        this.eventService = eventService;
        this.adminChecker = adminChecker;
    }


//    전체목록
    @GetMapping
    public PageResponse<EventResponse> getEvents(
            @RequestParam(required = false) EventStatus status,
            @PageableDefault(sort = "startsAt", direction = Sort.Direction.ASC) Pageable pageable,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        return eventService.getEvents(status, pageable, adminChecker.isAdmin(role)); // 관리자가 아니면 DRAFT 제외
    }


//  상세목록
    @GetMapping("/{eventId}")
    public EventResponse getEvent(
            @PathVariable Long eventId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        return eventService.getEvent(eventId, adminChecker.isAdmin(role));
    }

//   생성
    @PostMapping
    public ResponseEntity<EventResponse> createEvent(
            @Valid @RequestBody EventCreateRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        adminChecker.requireAdmin(userId, role); // ADMIN만 생성
        EventResponse created = eventService.createEvent(request, userId);
        return ResponseEntity.created(URI.create("/api/events/" + created.id())).body(created);
    }

//  수정
    @PatchMapping("/{eventId}")
    public EventResponse updateEvent(
            @PathVariable Long eventId,
            @Valid @RequestBody EventUpdateRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        adminChecker.requireAdmin(userId, role); // ADMIN만 수정
        return eventService.updateEvent(eventId, request);
    }

//  삭제
    @DeleteMapping("/{eventId}")
    public ResponseEntity<Void> deleteEvent(
            @PathVariable Long eventId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        adminChecker.requireAdmin(userId, role); // ADMIN만 삭제
        eventService.deleteEvent(eventId);
        return ResponseEntity.noContent().build();
    }
}
