package com.ems.event.event.controller;

import com.ems.event.common.security.AdminChecker;
import com.ems.event.common.dto.ApiSuccessResponse;
import com.ems.event.common.dto.PageResponse;
import com.ems.event.event.entity.EventStatus;
import com.ems.event.event.service.EventService;
import com.ems.event.event.dto.EventCreateRequest;
import com.ems.event.event.dto.EventResponse;
import com.ems.event.event.dto.EventUpdateRequest;
import jakarta.servlet.http.HttpServletRequest;
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
    public ApiSuccessResponse<PageResponse<EventResponse>> getEvents(
            @RequestParam(required = false) EventStatus status,
            @PageableDefault(sort = "startsAt", direction = Sort.Direction.ASC) Pageable pageable,
            @RequestHeader(value = "X-Member-Id", required = false) Long memberId,
            HttpServletRequest httpRequest) {
        return ApiSuccessResponse.ok(eventService.getEvents(status, pageable, memberId),
                "행사 목록 조회 성공", httpRequest); // DRAFT·회의 링크는 만든 사람에게만
    }


//  내 행사 목록 (ADMIN, 행사 관리 화면): 내가 만든 행사만 · 모든 상태
//  /events/mine 은 글자 주소라 아래 /{eventId}(숫자)보다 먼저 연결됨
    @GetMapping("/mine")
    public ApiSuccessResponse<PageResponse<EventResponse>> getMyEvents(
            @RequestParam(required = false) EventStatus status,
            @PageableDefault(sort = "startsAt", direction = Sort.Direction.ASC) Pageable pageable,
            @RequestHeader(value = "X-Member-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            HttpServletRequest httpRequest) {
        adminChecker.requireAdmin(userId, role); // ADMIN만
        return ApiSuccessResponse.ok(eventService.getMyEvents(userId, status, pageable),
                "내 행사 목록 조회 성공", httpRequest);
    }

//  상세목록
    @GetMapping("/{eventId}")
    public ApiSuccessResponse<EventResponse> getEvent(
            @PathVariable Long eventId,
            @RequestHeader(value = "X-Member-Id", required = false) Long memberId,
            HttpServletRequest httpRequest) {
        return ApiSuccessResponse.ok(eventService.getEvent(eventId, memberId), "행사 조회 성공", httpRequest);
    }

//   생성
    @PostMapping
    public ResponseEntity<ApiSuccessResponse<EventResponse>> createEvent(
            @Valid @RequestBody EventCreateRequest request,
            @RequestHeader(value = "X-Member-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            HttpServletRequest httpRequest) {
        adminChecker.requireAdmin(userId, role); // ADMIN만 생성
        EventResponse created = eventService.createEvent(request, userId);
        return ResponseEntity.created(URI.create("/api/events/" + created.id()))
                .body(ApiSuccessResponse.created(created, "행사 생성 완료", httpRequest));
    }

//  수정
    @PatchMapping("/{eventId}")
    public ApiSuccessResponse<EventResponse> updateEvent(
            @PathVariable Long eventId,
            @Valid @RequestBody EventUpdateRequest request,
            @RequestHeader(value = "X-Member-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            HttpServletRequest httpRequest) {
        adminChecker.requireAdmin(userId, role); // ADMIN만 수정
        return ApiSuccessResponse.ok(eventService.updateEvent(eventId, userId, request), "행사 수정 완료", httpRequest);
    }

//  삭제
    @DeleteMapping("/{eventId}")
    public ResponseEntity<Void> deleteEvent(
            @PathVariable Long eventId,
            @RequestHeader(value = "X-Member-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        adminChecker.requireAdmin(userId, role); // ADMIN만 삭제
        eventService.deleteEvent(eventId, userId);
        return ResponseEntity.noContent().build();
    }
}
