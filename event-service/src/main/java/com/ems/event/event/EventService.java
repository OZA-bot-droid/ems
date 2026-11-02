package com.ems.event.event;

import com.ems.event.common.BusinessException;
import com.ems.event.common.PageResponse;
import com.ems.event.event.dto.EventCreateRequest;
import com.ems.event.event.dto.EventResponse;
import com.ems.event.event.dto.EventUpdateRequest;
import com.ems.event.registration.repository.RegistrationRepository;
import com.ems.event.session.SessionRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
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
    private final RegistrationRepository registrationRepository;
    /** 지금 시각을 알려주는 시계 (테스트에서는 고정된 시계를 넣어 날짜가 지나도 결과가 같게 함) */
    private final Clock clock;

    public EventService(EventRepository eventRepository, SessionRepository sessionRepository,
                        RegistrationRepository registrationRepository, Clock clock) {
        this.eventRepository = eventRepository;
        this.sessionRepository = sessionRepository;
        this.registrationRepository = registrationRepository;
        this.clock = clock;
    }

    /**
     * 목록 조회 (viewerId = 요청한 회원 번호, 로그인 안 했으면 null)
     * - OPEN, CLOSED: 누구에게나 보임
     * - DRAFT: 그 행사를 만든 관리자에게만 보임 (다른 관리자에게도 숨김)
     * - 화상 회의 링크(meetingUrl): 그 행사를 만든 관리자에게만 보임
     */
    public PageResponse<EventResponse> getEvents(EventStatus status, Pageable pageable, Long viewerId) {
        Page<Event> page;
        if (status == null) {                                   // 전체: 공개 상태 + 내 DRAFT
            page = (viewerId == null)
                    ? eventRepository.findByStatusIn(PUBLIC_STATUSES, pageable)
                    : eventRepository.findVisibleTo(PUBLIC_STATUSES, EventStatus.DRAFT, viewerId, pageable);
        } else if (status.isVisibleToPublic()) {                // OPEN 또는 CLOSED만
            page = eventRepository.findByStatus(status, pageable);
        } else {                                                // DRAFT만: 내 것만
            page = (viewerId == null)
                    ? Page.empty(pageable)
                    : eventRepository.findByStatusAndCreatedBy(EventStatus.DRAFT, viewerId, pageable);
        }
        return PageResponse.of(page, event -> EventResponse.from(event, event.isOwnedBy(viewerId)));
    }

    /** 상세 조회. 남의 DRAFT는 없는 행사처럼 404, 화상 회의 링크는 만든 사람에게만 */
    public EventResponse getEvent(Long eventId, Long viewerId) {
        Event event = findEvent(eventId);
        if (!event.getStatus().isVisibleToPublic() && !event.isOwnedBy(viewerId)) {
            throw notFound(eventId);
        }
        return EventResponse.from(event, event.isOwnedBy(viewerId));
    }

    @Transactional
    public EventResponse createEvent(EventCreateRequest request, Long createdBy) {
        validatePeriod(request.startsAt(), request.endsAt());
        validateNotPast(request.startsAt());
        if (createdBy == null) {
            throw new BusinessException(
                    HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "로그인이 필요합니다.");
        }
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
    public EventResponse updateEvent(Long eventId, Long requesterId, EventUpdateRequest request) {
        Event event = findEvent(eventId);
        requireOwner(event, requesterId); // 행사를 만든 관리자만 수정·공개·마감
        if (event.isClosed()) {           // 마감된 행사는 내용·상태 모두 잠금 (삭제는 별도 규칙)
            throw new BusinessException(
                    HttpStatus.CONFLICT, "EVENT_CLOSED", "마감된 행사는 수정할 수 없습니다.");
        }
        // 시작/종료 중 하나만 바꿔도 바뀐 뒤의 기간이 올바른지 확인
        Instant startsAt = request.startsAt() != null ? request.startsAt() : event.getStartsAt();
        Instant endsAt = request.endsAt() != null ? request.endsAt() : event.getEndsAt();
        validatePeriod(startsAt, endsAt);
        // 시작 시각을 "바꿀 때만" 과거인지 검사 (이미 시작한 행사의 제목·설명 수정은 허용)
        if (request.startsAt() != null && !request.startsAt().equals(event.getStartsAt())) {
            validateNotPast(request.startsAt());
        }
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
    public void deleteEvent(Long eventId, Long requesterId) {
        Event event = findEvent(eventId);
        requireOwner(event, requesterId); // 행사를 만든 관리자만 삭제
        // 신청 내역이 있으면 삭제 금지 (registrations → events FK 때문에 DB도 거부함: 500 대신 409로 안내)
        // 신청 기록은 취소·거절된 것도 남겨야 하므로, 행사를 지우지 말고 "마감"으로 바꾸도록 안내
        if (registrationRepository.existsByEventId(eventId)) {
            throw new BusinessException(
                    HttpStatus.CONFLICT, "EVENT_HAS_REGISTRATIONS",
                    "참가 신청 내역이 있는 행사는 삭제할 수 없습니다. 행사를 마감 처리하세요.");
        }
        eventRepository.delete(event); // 세션은 DB의 ON DELETE CASCADE로 함께 삭제
    }

    private Event findEvent(Long eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> notFound(eventId));
    }

    /** 행사를 만든 관리자(createdBy)만 바꿀 수 있다. 세션·신청 승인과 같은 규칙 */
    private void requireOwner(Event event, Long requesterId) {
        if (!Objects.equals(event.getCreatedBy(), requesterId)) {
            throw new BusinessException(
                    HttpStatus.FORBIDDEN, "EVENT_OWNER_REQUIRED", "행사를 만든 관리자만 수정하거나 삭제할 수 있습니다.");
        }
    }

    private BusinessException notFound(Long eventId) {
        return new BusinessException(
                HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND", "행사를 찾을 수 없습니다: " + eventId);
    }

    private void validatePeriod(Instant startsAt, Instant endsAt) {
        if (!endsAt.isAfter(startsAt)) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST, "INVALID_PERIOD", "종료 시각은 시작 시각보다 뒤여야 합니다.");
        }
    }

    /** 시작 시각은 지금보다 뒤여야 한다 (지난 시간으로 행사를 만들 수 없음) */
    private void validateNotPast(Instant startsAt) {
        if (!startsAt.isAfter(Instant.now(clock))) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST, "PAST_START_TIME", "시작 시각은 현재 시각 이후여야 합니다.");
        }
    }
}
