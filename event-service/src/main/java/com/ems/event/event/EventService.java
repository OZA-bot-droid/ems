package com.ems.event.event;

import com.ems.event.common.BusinessException;
import com.ems.event.common.PageResponse;
import com.ems.event.event.dto.EventCreateRequest;
import com.ems.event.event.dto.EventResponse;
import com.ems.event.event.dto.EventUpdateRequest;
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class EventService {

    private final EventRepository eventRepository;

    public EventService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    /** 목록 조회. status가 없으면 전체 */
    public PageResponse<EventResponse> getEvents(EventStatus status, Pageable pageable) {
        Page<Event> page = (status == null)
                ? eventRepository.findAll(pageable)
                : eventRepository.findByStatus(status, pageable);
        return PageResponse.of(page, EventResponse::from);
    }

    public EventResponse getEvent(UUID eventId) {
        return EventResponse.from(findEvent(eventId));
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

        event.update(
                request.title(),
                request.description(),
                request.capacity(),
                request.startsAt(),
                request.endsAt(),
                request.status());
        return EventResponse.from(event); // 트랜잭션이 끝나면 변경 내용이 자동 저장됨
    }

    @Transactional
    public void deleteEvent(UUID eventId) {
        eventRepository.delete(findEvent(eventId));
    }

    private Event findEvent(UUID eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new BusinessException(
                        HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND", "행사를 찾을 수 없습니다: " + eventId));
    }

    private void validatePeriod(Instant startsAt, Instant endsAt) {
        if (!endsAt.isAfter(startsAt)) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST, "INVALID_PERIOD", "종료 시각은 시작 시각보다 뒤여야 합니다.");
        }
    }
}
