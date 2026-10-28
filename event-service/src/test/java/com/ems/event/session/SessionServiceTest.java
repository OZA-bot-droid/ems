package com.ems.event.session;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.ems.event.common.BusinessException;
import com.ems.event.event.Event;
import com.ems.event.event.EventRepository;
import com.ems.event.session.dto.SessionCreateRequest;
import com.ems.event.session.dto.SessionResponse;
import com.ems.event.session.dto.SessionUpdateRequest;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/** 세션 시간 규칙 (행사 시간 안, 겹침 금지)을 DB 없이 검사한다 */
@ExtendWith(MockitoExtension.class)
class SessionServiceTest {

    @Mock
    SessionRepository sessionRepository;

    @Mock
    EventRepository eventRepository;

    @InjectMocks
    SessionService sessionService;

    private final Long eventId = 1L;
    private static final Long EVENT_OWNER_ID = 99L;
    /** 같은 관리자지만 이 행사를 만들지 않은 사람 */
    private static final Long OTHER_ADMIN_ID = 3L;
    private final Long sessionId = 10L;

    /** 한국 시간 14:00 = UTC 05:00 */
    private static Instant at(String hhmm) {
        return Instant.parse("2026-11-01T" + hhmm + ":00Z");
    }

    /** 한국 시간 14:00 ~ 17:00 행사 (작성 중 DRAFT) */
    private static Event seminar() {
        return new Event("Cloud Native 세미나", null, 100, at("05:00"), at("08:00"), null, EVENT_OWNER_ID);
    }

    @Test
    @DisplayName("행사 시간 안에서 겹치지 않으면 세션이 만들어진다")
    void createSession() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(seminar()));
        when(sessionRepository.existsOverlap(eventId, at("05:00"), at("05:45"))).thenReturn(false);
        when(sessionRepository.save(any(Session.class))).thenAnswer(call -> call.getArgument(0));

        SessionResponse created = sessionService.createSession(eventId, EVENT_OWNER_ID,
                new SessionCreateRequest("클라우드 아키텍처의 현재", at("05:00"), at("05:45")));

        assertThat(created.title()).isEqualTo("클라우드 아키텍처의 현재");
        assertThat(created.startsAt()).isEqualTo(at("05:00"));
    }

    @Test
    @DisplayName("행사 시간 밖이면 400 SESSION_OUT_OF_EVENT")
    void sessionOutsideEvent() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(seminar()));

        assertThatThrownBy(() -> sessionService.createSession(eventId, EVENT_OWNER_ID,
                new SessionCreateRequest("행사 밖", at("08:00"), at("08:30"))))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("SESSION_OUT_OF_EVENT");
        verify(sessionRepository, never()).save(any());
    }

    @Test
    @DisplayName("다른 세션과 겹치면 409 SESSION_TIME_CONFLICT")
    void overlappingSession() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(seminar()));
        when(sessionRepository.existsOverlap(eventId, at("05:30"), at("06:15"))).thenReturn(true);

        assertThatThrownBy(() -> sessionService.createSession(eventId, EVENT_OWNER_ID,
                new SessionCreateRequest("겹치는 세션", at("05:30"), at("06:15"))))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("SESSION_TIME_CONFLICT");
        verify(sessionRepository, never()).save(any());
    }

    @Test
    @DisplayName("종료가 시작보다 빠르면 400 INVALID_PERIOD")
    void invalidPeriod() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(seminar()));

        assertThatThrownBy(() -> sessionService.createSession(eventId, EVENT_OWNER_ID,
                new SessionCreateRequest("거꾸로", at("06:00"), at("05:00"))))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("INVALID_PERIOD");
    }

    @Test
    @DisplayName("DRAFT 행사의 세션은 일반 회원에게 404, 관리자에게는 보인다")
    void draftSessionsOnlyForAdmin() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(seminar()));
        when(sessionRepository.findByEventIdOrderByStartsAtAsc(eventId)).thenReturn(List.of());

        assertThatThrownBy(() -> sessionService.getSessions(eventId, false))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("EVENT_NOT_FOUND");
        assertThat(sessionService.getSessions(eventId, true)).isEmpty();
    }

    // ===== 소유권: 행사를 만든 관리자만 세션을 관리할 수 있다 =====

    @Test
    @DisplayName("다른 관리자가 세션을 만들면 403 EVENT_OWNER_REQUIRED, 저장하지 않는다")
    void otherAdminCannotCreateSession() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(seminar()));

        assertThatThrownBy(() -> sessionService.createSession(eventId, OTHER_ADMIN_ID,
                new SessionCreateRequest("남의 행사 세션", at("05:00"), at("05:45"))))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("EVENT_OWNER_REQUIRED");
        verify(sessionRepository, never()).save(any());
    }

    @Test
    @DisplayName("다른 관리자가 세션을 수정하면 403 EVENT_OWNER_REQUIRED, 내용이 바뀌지 않는다")
    void otherAdminCannotUpdateSession() {
        Session session = new Session(seminar(), "원래 제목", at("05:00"), at("05:45"));
        when(sessionRepository.findByIdAndEventId(sessionId, eventId)).thenReturn(Optional.of(session));

        assertThatThrownBy(() -> sessionService.updateSession(eventId, sessionId, OTHER_ADMIN_ID,
                new SessionUpdateRequest("바꾼 제목", null, null)))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("EVENT_OWNER_REQUIRED");
        assertThat(session.getTitle()).isEqualTo("원래 제목");
    }

    @Test
    @DisplayName("다른 관리자가 세션을 삭제하면 403 EVENT_OWNER_REQUIRED, 삭제하지 않는다")
    void otherAdminCannotDeleteSession() {
        Session session = new Session(seminar(), "원래 제목", at("05:00"), at("05:45"));
        when(sessionRepository.findByIdAndEventId(sessionId, eventId)).thenReturn(Optional.of(session));

        assertThatThrownBy(() -> sessionService.deleteSession(eventId, sessionId, OTHER_ADMIN_ID))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("EVENT_OWNER_REQUIRED");
        verify(sessionRepository, never()).delete(any());
    }

    @Test
    @DisplayName("회원 번호가 없으면(null) 소유자가 아니므로 403")
    void anonymousCannotCreateSession() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(seminar()));

        assertThatThrownBy(() -> sessionService.createSession(eventId, null,
                new SessionCreateRequest("세션", at("05:00"), at("05:45"))))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("EVENT_OWNER_REQUIRED");
    }
}
