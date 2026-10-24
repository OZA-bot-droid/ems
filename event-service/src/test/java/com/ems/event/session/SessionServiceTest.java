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

    /** 한국 시간 14:00 = UTC 05:00 */
    private static Instant at(String hhmm) {
        return Instant.parse("2026-11-01T" + hhmm + ":00Z");
    }

    /** 한국 시간 14:00 ~ 17:00 행사 (작성 중 DRAFT) */
    private static Event seminar() {
        return new Event("Cloud Native 세미나", null, 100, at("05:00"), at("08:00"), null, null);
    }

    @Test
    @DisplayName("행사 시간 안에서 겹치지 않으면 세션이 만들어진다")
    void createSession() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(seminar()));
        when(sessionRepository.existsOverlap(eventId, at("05:00"), at("05:45"))).thenReturn(false);
        when(sessionRepository.save(any(Session.class))).thenAnswer(call -> call.getArgument(0));

        SessionResponse created = sessionService.createSession(eventId,
                new SessionCreateRequest("클라우드 아키텍처의 현재", at("05:00"), at("05:45")));

        assertThat(created.title()).isEqualTo("클라우드 아키텍처의 현재");
        assertThat(created.startsAt()).isEqualTo(at("05:00"));
    }

    @Test
    @DisplayName("행사 시간 밖이면 400 SESSION_OUT_OF_EVENT")
    void sessionOutsideEvent() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(seminar()));

        assertThatThrownBy(() -> sessionService.createSession(eventId,
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

        assertThatThrownBy(() -> sessionService.createSession(eventId,
                new SessionCreateRequest("겹치는 세션", at("05:30"), at("06:15"))))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("SESSION_TIME_CONFLICT");
        verify(sessionRepository, never()).save(any());
    }

    @Test
    @DisplayName("종료가 시작보다 빠르면 400 INVALID_PERIOD")
    void invalidPeriod() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(seminar()));

        assertThatThrownBy(() -> sessionService.createSession(eventId,
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
}
