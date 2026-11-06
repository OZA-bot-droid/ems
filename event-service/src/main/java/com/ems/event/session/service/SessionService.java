package com.ems.event.session.service;

import com.ems.event.common.exception.BusinessException;
import com.ems.event.event.entity.Event;
import com.ems.event.event.repository.EventRepository;
import com.ems.event.session.entity.Session;
import com.ems.event.session.repository.SessionRepository;
import com.ems.event.session.dto.SessionCreateRequest;
import com.ems.event.session.dto.SessionResponse;
import com.ems.event.session.dto.SessionUpdateRequest;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class SessionService {

    private final SessionRepository sessionRepository;
    private final EventRepository eventRepository;

    public SessionService(SessionRepository sessionRepository, EventRepository eventRepository) {
        this.sessionRepository = sessionRepository;
        this.eventRepository = eventRepository;
    }

    /** 행사의 세션 목록 (시작 시각 순). DRAFT 행사의 세션은 그 행사를 만든 관리자에게만 보임 */
    public List<SessionResponse> getSessions(Long eventId, Long viewerId) {
        Event event = findEvent(eventId); // 없는 행사면 404
        if (!event.getStatus().isVisibleToPublic() && !event.isOwnedBy(viewerId)) {
            throw new BusinessException(
                    HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND", "행사를 찾을 수 없습니다: " + eventId);
        }
        return sessionRepository.findByEventIdOrderByStartsAtAsc(eventId).stream()
                .map(SessionResponse::from)
                .toList();
    }

    /**
     * 관리자용 세션 목록 (세션 관리 화면). 행사를 만든 관리자만 볼 수 있고, DRAFT 행사도 볼 수 있음
     * - 공개 목록(getSessions)과 달리 로그인·소유자 확인이 필수 → Gateway의 보호 경로로 호출됨
     */
    public List<SessionResponse> getSessionsForOwner(Long eventId, Long ownerId) {
        Event event = findEvent(eventId);
        requireOwner(event, ownerId);
        return sessionRepository.findByEventIdOrderByStartsAtAsc(eventId).stream()
                .map(SessionResponse::from)
                .toList();
    }

    /** 세션 생성: 행사 시간 안에서, 다른 세션과 겹치지 않게 */
    @Transactional
    public SessionResponse createSession(Long eventId, Long requesterId, SessionCreateRequest request) {
        Event event = findEvent(eventId);
        requireOwner(event, requesterId);
        requireNotClosed(event);
        validateTimeSlot(event, request.startsAt(), request.endsAt());

        if (sessionRepository.existsOverlap(eventId, request.startsAt(), request.endsAt())) {
            throw timeConflict();
        }

        Session session = new Session(
                event,
                request.title(),
                request.startsAt(),
                request.endsAt());
        return SessionResponse.from(sessionRepository.save(session));
    }

    /** 세션 수정: 바뀐 뒤의 시간대가 행사 안이고, 다른 세션과 겹치지 않는지 확인 */
    @Transactional
    public SessionResponse updateSession(
            Long eventId, Long sessionId, Long requesterId, SessionUpdateRequest request) {
        Session session = findSession(eventId, sessionId);
        Event event = session.getEvent();
        requireOwner(event, requesterId);
        requireNotClosed(event);

        // 시작/종료 중 하나만 보내도 "바뀐 뒤의 시간대"로 검사
        Instant startsAt = request.startsAt() != null ? request.startsAt() : session.getStartsAt();
        Instant endsAt = request.endsAt() != null ? request.endsAt() : session.getEndsAt();
        validateTimeSlot(event, startsAt, endsAt);

        if (sessionRepository.existsOverlapExcluding(eventId, sessionId, startsAt, endsAt)) {
            throw timeConflict();
        }

        session.update(
                request.title(),
                request.startsAt(),
                request.endsAt());
        return SessionResponse.from(session); // 변경 감지로 자동 저장
    }

    @Transactional
    public void deleteSession(Long eventId, Long sessionId, Long requesterId) {
        Session session = findSession(eventId, sessionId);
        requireOwner(session.getEvent(), requesterId);
        requireNotClosed(session.getEvent());
        sessionRepository.delete(session);
    }

    // ===== 도우미 메서드 =====

    private Event findEvent(Long eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new BusinessException(
                        HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND", "행사를 찾을 수 없습니다: " + eventId));
    }

    private Session findSession(Long eventId, Long sessionId) {
        return sessionRepository.findByIdAndEventId(sessionId, eventId)
                .orElseThrow(() -> new BusinessException(
                        HttpStatus.NOT_FOUND, "SESSION_NOT_FOUND", "세션을 찾을 수 없습니다: " + sessionId));
    }

    /** 세션 변경은 행사 생성자만 할 수 있습니다. */
    private void requireOwner(Event event, Long requesterId) {
        if (!Objects.equals(event.getCreatedBy(), requesterId)) {
            throw new BusinessException(
                    HttpStatus.FORBIDDEN, "EVENT_OWNER_REQUIRED", "행사 소유자만 세션을 관리할 수 있습니다.");
        }
    }

    /** 마감된 행사의 세션은 추가·수정·삭제할 수 없습니다. (조회는 가능) */
    private void requireNotClosed(Event event) {
        if (event.isClosed()) {
            throw new BusinessException(
                    HttpStatus.CONFLICT, "EVENT_CLOSED", "마감된 행사의 세션은 바꿀 수 없습니다.");
        }
    }

    /**
     * 시간대 규칙
     * 1) 종료 시각은 시작 시각보다 뒤
     * 2) 행사의 startsAt ~ endsAt 안에 들어가야 함 (경계는 포함)
     */
    private void validateTimeSlot(Event event, Instant startsAt, Instant endsAt) {
        if (!endsAt.isAfter(startsAt)) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST, "INVALID_PERIOD", "종료 시각은 시작 시각보다 뒤여야 합니다.");
        }
        if (startsAt.isBefore(event.getStartsAt()) || endsAt.isAfter(event.getEndsAt())) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST, "SESSION_OUT_OF_EVENT",
                    "세션은 행사 시간(" + event.getStartsAt() + " ~ " + event.getEndsAt() + ") 안에서만 만들 수 있습니다.");
        }
    }

    private BusinessException timeConflict() {
        return new BusinessException(
                HttpStatus.CONFLICT, "SESSION_TIME_CONFLICT", "같은 시간대에 이미 다른 세션이 있습니다.");
    }
}
