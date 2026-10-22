package com.ems.event.event;

import com.ems.event.common.BusinessException;
import com.ems.event.common.PageResponse;
import com.ems.event.event.dto.EventCreateRequest;
import com.ems.event.event.dto.EventResponse;
import com.ems.event.event.dto.EventUpdateRequest;
import com.ems.event.session.SessionRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class EventService {

    /** 일반 회원에게 보이는 상태 */
    private static final List<EventStatus> PUBLIC_STATUSES = List.of(EventStatus.OPEN, EventStatus.CLOSED);

    private final EventRepository eventRepository;
    private final SessionRepository sessionRepository;

    public EventService(EventRepository eventRepository, SessionRepository sessionRepository) {
        this.eventRepository = eventRepository;
        this.sessionRepository = sessionRepository;
    }

    /**
     * 목록 조회. status가 없으면 전체
     * - 관리자: 모든 상태
     * - 일반 회원: OPEN, CLOSED만 (DRAFT는 작성 중이라 숨김), 화상 회의 링크도 숨김
     */
    public PageResponse<EventResponse> getEvents(EventStatus status, Pageable pageable, boolean admin) {
        Page<Event> page;
        if (admin) {
            page = (status == null)
                    ? eventRepository.findAll(pageable)
                    : eventRepository.findByStatus(status, pageable);
        } else {
            List<EventStatus> visible = (status == null) ? PUBLIC_STATUSES
                    : (status.isVisibleToPublic() ? List.of(status) : List.of());
            page = visible.isEmpty()
                    ? Page.empty(pageable)
                    : eventRepository.findByStatusIn(visible, pageable);
        }
        return PageResponse.of(page, event -> EventResponse.from(event, admin));
    }

    /** 상세 조회. 일반 회원이 DRAFT 행사를 조회하면 없는 행사처럼 404 */
    public EventResponse getEvent(UUID eventId, boolean admin) {
        Event event = findEvent(eventId);
        if (!admin && !event.getStatus().isVisibleToPublic()) {
            throw notFound(eventId);
        }
        return EventResponse.from(event, admin);
    }

    @Transactional
    public EventResponse createEvent(EventCreateRequest request, UUID createdBy) {
        validatePeriod(request.startsAt(), request.endsAt());
        Event event = new Event(
                request.title(),
                request.description(),
                request.capacity(),
                request.startsAt(),
                request.endsAt(),
                request.meetingUrl(),
                createdBy);
        return EventResponse.from(eventRepository.save(event));
    }

    @Transactional
    public EventResponse updateEvent(UUID eventId, EventUpdateRequest request) {
        Event event = findEvent(eventId);
        // 시작/종료 중 하나만 바꿔도 바뀐 뒤의 기간이 올바른지 확인
        Instant startsAt = request.startsAt() != null ? request.startsAt() : event.getStartsAt();
        Instant endsAt = request.endsAt() != null ? request.endsAt() : event.getEndsAt();
        validatePeriod(startsAt, endsAt);
        // 상태는 DRAFT → OPEN → CLOSED 순서로만 바꿀 수 있다
        if (!event.getStatus().canChangeTo(request.status())) {
            throw new BusinessException(
                    HttpStatus.CONFLICT, "INVALID_STATUS_CHANGE",
                    "행사 상태는 DRAFT → OPEN → CLOSED 순서로만 바꿀 수 있습니다. (현재: "
                            + event.getStatus() + ", 요청: " + request.status() + ")");
        }
        // 행사 일정을 줄였을 때 이미 등록된 세션이 행사 밖으로 벗어나면 막는다
        if (sessionRepository.existsOutsidePeriod(eventId, startsAt, endsAt)) {
            throw new BusinessException(
                    HttpStatus.CONFLICT, "SESSION_OUT_OF_EVENT",
                    "행사 시간 밖에 있는 세션이 있습니다. 세션을 먼저 수정하거나 삭제하세요.");
        }

        event.update(
                request.title(),
                request.description(),
                request.capacity(),
                request.startsAt(),
                request.endsAt(),
                request.meetingUrl(),
                request.status());
        return EventResponse.from(event); // 트랜잭션이 끝나면 변경 내용이 자동 저장됨
    }

    @Transactional
    public void deleteEvent(UUID eventId) {
        eventRepository.delete(findEvent(eventId));
    }

    private Event findEvent(UUID eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> notFound(eventId));
    }

    private BusinessException notFound(UUID eventId) {
        return new BusinessException(
                HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND", "행사를 찾을 수 없습니다: " + eventId);
    }

    private void validatePeriod(Instant startsAt, Instant endsAt) {
        if (!endsAt.isAfter(startsAt)) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST, "INVALID_PERIOD", "종료 시각은 시작 시각보다 뒤여야 합니다.");
        }
    }
}
