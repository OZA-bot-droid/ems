package com.ems.event.event.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.ems.event.common.exception.BusinessException;
import com.ems.event.common.dto.PageResponse;
import com.ems.event.event.entity.Event;
import com.ems.event.event.entity.EventStatus;
import com.ems.event.event.repository.EventRepository;
import com.ems.event.event.dto.EventCreateRequest;
import com.ems.event.event.dto.EventResponse;
import com.ems.event.event.dto.EventUpdateRequest;
import com.ems.event.registration.repository.RegistrationRepository;
import com.ems.event.session.repository.SessionRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

/** DB 없이 EventService의 규칙만 검사한다 (Repository는 가짜 객체 Mock) */
@ExtendWith(MockitoExtension.class)
class EventServiceTest {

    @Mock
    EventRepository eventRepository;

    @Mock
    SessionRepository sessionRepository;

    @Mock
    RegistrationRepository registrationRepository;

    EventService eventService;

    /** 테스트 속 "지금"은 항상 2026-10-01 (실제 날짜가 지나도 테스트 결과가 바뀌지 않음) */
    private static final Clock FIXED_CLOCK = Clock.fixed(Instant.parse("2026-10-01T00:00:00Z"), ZoneOffset.UTC);

    @BeforeEach
    void setUp() {
        eventService = new EventService(eventRepository, sessionRepository, registrationRepository, FIXED_CLOCK);
    }

    private final Long eventId = 1L;
    /** 테스트 행사를 만든 관리자 / 다른 관리자 */
    private static final Long OWNER_ID = 99L;
    private static final Long OTHER_ADMIN_ID = 3L;

    /** 한국 시간 14:00 = UTC 05:00 */
    private static Instant at(String hhmm) {
        return Instant.parse("2026-11-01T" + hhmm + ":00Z");
    }

    private static Event seminar(String meetingUrl) {
        return new Event("Cloud Native 세미나", "설명", 100, at("05:00"), at("08:00"), meetingUrl, 99L);
    }

    private static Event openSeminar(String meetingUrl) {
        Event event = seminar(meetingUrl);
        event.update(null, null, null, null, null, null, EventStatus.OPEN);
        return event;
    }

    @Test
    @DisplayName("새 행사는 항상 DRAFT로 저장된다")
    void createEventStartsAsDraft() {
        when(eventRepository.save(any(Event.class))).thenAnswer(call -> call.getArgument(0));

        EventResponse created = eventService.createEvent(new EventCreateRequest(
                "Cloud Native 세미나", null, 100, at("05:00"), at("08:00"), "https://zoom.us/j/1"), 99L);

        assertThat(created.status()).isEqualTo(EventStatus.DRAFT);
        assertThat(created.meetingUrl()).isEqualTo("https://zoom.us/j/1");
    }

    @Test
    @DisplayName("종료 시각이 시작보다 빠르면 400 INVALID_PERIOD, 저장하지 않는다")
    void createEventWithInvalidPeriod() {
        EventCreateRequest request = new EventCreateRequest(
                "거꾸로 행사", null, 100, at("08:00"), at("05:00"), null);

        assertThatThrownBy(() -> eventService.createEvent(request, null))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("INVALID_PERIOD");
        verify(eventRepository, never()).save(any());
    }

    @Test
    @DisplayName("일반 회원이 DRAFT 행사를 조회하면 404")
    void draftIsNotFoundForMember() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(seminar(null)));

        assertThatThrownBy(() -> eventService.getEvent(eventId, 2L))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("EVENT_NOT_FOUND");
    }

    @Test
    @DisplayName("화상 회의 링크는 그 행사를 만든 관리자에게만 보인다 (일반 회원·다른 관리자·비로그인은 null)")
    void meetingUrlOnlyForOwner() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(openSeminar("https://zoom.us/j/1")));

        assertThat(eventService.getEvent(eventId, 2L).meetingUrl()).isNull();              // 일반 회원
        assertThat(eventService.getEvent(eventId, OTHER_ADMIN_ID).meetingUrl()).isNull();  // 다른 관리자
        assertThat(eventService.getEvent(eventId, null).meetingUrl()).isNull();            // 비로그인
        assertThat(eventService.getEvent(eventId, OWNER_ID).meetingUrl()).isEqualTo("https://zoom.us/j/1");
    }

    @Test
    @DisplayName("로그인하지 않고 DRAFT 목록을 요청하면 DB를 조회하지 않고 빈 목록")
    void anonymousCannotListDrafts() {
        PageResponse<EventResponse> page = eventService.getEvents(EventStatus.DRAFT, PageRequest.of(0, 10), null);

        assertThat(page.content()).isEmpty();
        assertThat(page.totalElements()).isZero();
        verifyNoInteractions(eventRepository);
    }

    @Test
    @DisplayName("OPEN 행사를 DRAFT로 되돌리면 409 INVALID_STATUS_CHANGE")
    void cannotChangeStatusBackwards() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(openSeminar(null)));
        EventUpdateRequest request = new EventUpdateRequest(null, null, null, null, null, null, EventStatus.DRAFT);

        assertThatThrownBy(() -> eventService.updateEvent(eventId, OWNER_ID, request))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("INVALID_STATUS_CHANGE");
    }

    @Test
    @DisplayName("마감된 행사를 수정하면 409 EVENT_CLOSED, 내용이 바뀌지 않는다")
    void cannotUpdateClosedEvent() {
        Event closed = openSeminar(null);
        closed.update(null, null, null, null, null, null, EventStatus.CLOSED);
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(closed));
        EventUpdateRequest request = new EventUpdateRequest("바뀐 제목", null, null, null, null, null, null);

        assertThatThrownBy(() -> eventService.updateEvent(eventId, OWNER_ID, request))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("EVENT_CLOSED");
        assertThat(closed.getTitle()).isEqualTo("Cloud Native 세미나");
    }

    @Test
    @DisplayName("행사 시간을 줄여서 세션이 밖으로 벗어나면 409 SESSION_OUT_OF_EVENT")
    void cannotShrinkEventPastSessions() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(seminar(null)));
        when(sessionRepository.existsOutsidePeriod(eventId, at("05:00"), at("07:00"))).thenReturn(true);
        EventUpdateRequest request = new EventUpdateRequest(null, null, null, null, at("07:00"), null, null);

        assertThatThrownBy(() -> eventService.updateEvent(eventId, OWNER_ID, request))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("SESSION_OUT_OF_EVENT");
    }

    @Test
    @DisplayName("시작 시각이 지금보다 과거면 400 PAST_START_TIME")
    void cannotCreateEventInPast() {
        EventCreateRequest request = new EventCreateRequest(
                "지난 행사", null, 100, Instant.parse("2026-09-30T05:00:00Z"), Instant.parse("2026-09-30T08:00:00Z"), null);

        assertThatThrownBy(() -> eventService.createEvent(request, null))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("PAST_START_TIME");
        verify(eventRepository, never()).save(any());
    }

    @Test
    @DisplayName("이미 시작한 행사라도 시작 시각을 안 바꾸면 제목 수정은 가능")
    void canEditTitleOfStartedEvent() {
        // 지금(10/01)보다 앞선 9/30에 시작한 행사
        Event started = new Event("지난 행사", null, 100,
                Instant.parse("2026-09-30T05:00:00Z"), Instant.parse("2026-09-30T08:00:00Z"), null, 99L);
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(started));
        EventUpdateRequest request = new EventUpdateRequest(
                "새 제목", null, null, started.getStartsAt(), null, null, null); // 같은 시작 시각을 그대로 보냄

        assertThat(eventService.updateEvent(eventId, OWNER_ID, request).title()).isEqualTo("새 제목");
    }

    @Test
    @DisplayName("수정에서 시작 시각을 과거로 바꾸면 400 PAST_START_TIME")
    void cannotMoveStartToPast() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(seminar(null)));
        EventUpdateRequest request = new EventUpdateRequest(
                null, null, null, Instant.parse("2026-09-30T05:00:00Z"), null, null, null);

        assertThatThrownBy(() -> eventService.updateEvent(eventId, OWNER_ID, request))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("PAST_START_TIME");
    }

    @Test
    @DisplayName("만든 사람(회원 번호)이 없으면 401 UNAUTHORIZED, 저장하지 않는다")
    void createEventRequiresMember() {
        EventCreateRequest request = new EventCreateRequest(
                "Cloud Native 세미나", null, 100, at("05:00"), at("08:00"), null);

        assertThatThrownBy(() -> eventService.createEvent(request, null))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("UNAUTHORIZED");
        verify(eventRepository, never()).save(any());
    }

    @Test
    @DisplayName("참가 신청이 있는 행사를 삭제하면 409 EVENT_HAS_REGISTRATIONS, 삭제하지 않는다")
    void cannotDeleteEventWithRegistrations() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(seminar(null)));
        when(registrationRepository.existsByEventId(eventId)).thenReturn(true);

        assertThatThrownBy(() -> eventService.deleteEvent(eventId, OWNER_ID))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("EVENT_HAS_REGISTRATIONS");
        verify(eventRepository, never()).delete(any());
    }

    @Test
    @DisplayName("참가 신청이 없는 행사는 삭제된다")
    void deleteEventWithoutRegistrations() {
        Event event = seminar(null);
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
        when(registrationRepository.existsByEventId(eventId)).thenReturn(false);

        eventService.deleteEvent(eventId, OWNER_ID);

        verify(eventRepository).delete(event);
    }

    @Test
    @DisplayName("없는 행사를 삭제하면 404 EVENT_NOT_FOUND")
    void deleteMissingEvent() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> eventService.deleteEvent(eventId, OWNER_ID))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("EVENT_NOT_FOUND");
        verifyNoInteractions(registrationRepository);
    }

    // ===== 소유권: 행사를 만든 관리자만 수정·삭제 =====

    @Test
    @DisplayName("다른 관리자가 행사를 수정(공개 포함)하면 403 EVENT_OWNER_REQUIRED, 바뀌지 않는다")
    void otherAdminCannotUpdateEvent() {
        Event event = seminar(null);
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
        EventUpdateRequest request = new EventUpdateRequest("남이 바꾼 제목", null, null, null, null, null, EventStatus.OPEN);

        assertThatThrownBy(() -> eventService.updateEvent(eventId, OTHER_ADMIN_ID, request))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("EVENT_OWNER_REQUIRED");
        assertThat(event.getTitle()).isEqualTo("Cloud Native 세미나");
        assertThat(event.getStatus()).isEqualTo(EventStatus.DRAFT);
    }

    @Test
    @DisplayName("다른 관리자가 행사를 삭제하면 403 EVENT_OWNER_REQUIRED, 삭제하지 않는다")
    void otherAdminCannotDeleteEvent() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(seminar(null)));

        assertThatThrownBy(() -> eventService.deleteEvent(eventId, OTHER_ADMIN_ID))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("EVENT_OWNER_REQUIRED");
        verify(eventRepository, never()).delete(any());
        verifyNoInteractions(registrationRepository);
    }

    // ===== 보기 권한: DRAFT와 화상 회의 링크는 만든 관리자에게만 =====

    @Test
    @DisplayName("다른 관리자가 남의 DRAFT 행사를 조회하면 404 (없는 행사처럼)")
    void otherAdminCannotSeeDraft() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(seminar("https://zoom.us/j/1")));

        assertThatThrownBy(() -> eventService.getEvent(eventId, OTHER_ADMIN_ID))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("EVENT_NOT_FOUND");
    }

    @Test
    @DisplayName("만든 관리자는 자기 DRAFT 행사와 회의 링크를 볼 수 있다")
    void ownerSeesOwnDraft() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(seminar("https://zoom.us/j/1")));

        EventResponse found = eventService.getEvent(eventId, OWNER_ID);

        assertThat(found.status()).isEqualTo(EventStatus.DRAFT);
        assertThat(found.meetingUrl()).isEqualTo("https://zoom.us/j/1");
    }

    @Test
    @DisplayName("전체 목록: 로그인한 회원은 '공개 행사 + 내 DRAFT'를 조회하고, 링크는 내 행사에만 보인다")
    void listShowsPublicAndOwnDrafts() {
        PageRequest pageable = PageRequest.of(0, 10);
        Event mine = openSeminar("https://zoom.us/j/mine");                                    // 99번이 만든 행사
        Event others = new Event("남의 행사", null, 50, at("05:00"), at("08:00"), "https://zoom.us/j/other", OTHER_ADMIN_ID);
        when(eventRepository.findVisibleTo(List.of(EventStatus.OPEN, EventStatus.CLOSED), EventStatus.DRAFT, OWNER_ID, pageable))
                .thenReturn(new PageImpl<>(List.of(mine, others), pageable, 2));

        PageResponse<EventResponse> page = eventService.getEvents(null, pageable, OWNER_ID);

        assertThat(page.content()).hasSize(2);
        assertThat(page.content().get(0).meetingUrl()).isEqualTo("https://zoom.us/j/mine");
        assertThat(page.content().get(1).meetingUrl()).isNull();
    }

    @Test
    @DisplayName("DRAFT 필터: 내가 만든 DRAFT만 조회한다")
    void draftFilterOnlyMine() {
        PageRequest pageable = PageRequest.of(0, 10);
        when(eventRepository.findByStatusAndCreatedBy(EventStatus.DRAFT, OWNER_ID, pageable))
                .thenReturn(new PageImpl<>(List.of(seminar(null)), pageable, 1));

        PageResponse<EventResponse> page = eventService.getEvents(EventStatus.DRAFT, pageable, OWNER_ID);

        assertThat(page.totalElements()).isEqualTo(1);
        verify(eventRepository, never()).findByStatus(any(), any());
    }

    @Test
    @DisplayName("내 행사 목록(행사 관리): 내가 만든 행사만 조회하고 회의 링크도 보인다")
    void myEventsOnlyMine() {
        PageRequest pageable = PageRequest.of(0, 10);
        Event mine = new Event("내 행사", null, 50, at("05:00"), at("08:00"), "https://zoom.us/j/mine", OWNER_ID);
        when(eventRepository.findByCreatedBy(OWNER_ID, pageable))
                .thenReturn(new PageImpl<>(List.of(mine), pageable, 1));

        PageResponse<EventResponse> page = eventService.getMyEvents(OWNER_ID, null, pageable);

        assertThat(page.totalElements()).isEqualTo(1);
        assertThat(page.content().get(0).meetingUrl()).isEqualTo("https://zoom.us/j/mine");
        verify(eventRepository, never()).findVisibleTo(any(), any(), any(), any()); // 남의 행사가 섞이는 조회는 안 씀
    }

    @Test
    @DisplayName("자동 마감: 지금 시각을 기준으로 끝난 DRAFT·OPEN 행사를 CLOSED로 바꾸라고 요청한다")
    void closeEndedEventsUsesNowForDraftAndOpen() {
        List<EventStatus> targets = List.of(EventStatus.DRAFT, EventStatus.OPEN);
        when(eventRepository.closeEndedEvents(targets, EventStatus.CLOSED, Instant.now(FIXED_CLOCK)))
                .thenReturn(3);

        int closed = eventService.closeEndedEvents();

        assertThat(closed).isEqualTo(3);
        verify(eventRepository).closeEndedEvents(eq(targets), eq(EventStatus.CLOSED),
                eq(Instant.parse("2026-10-01T00:00:00Z")));
    }

    @Test
    @DisplayName("게시 예약: 게시일을 넣어 만들면 DRAFT로 저장되고 게시일이 기록된다")
    void createEventWithPostedDate() {
        when(eventRepository.save(any(Event.class))).thenAnswer(call -> call.getArgument(0));

        EventResponse created = eventService.createEvent(new EventCreateRequest(
                "예약 행사", null, 100, at("05:00"), at("08:00"), null, Instant.parse("2026-10-15T00:00:00Z")), 99L);

        assertThat(created.status()).isEqualTo(EventStatus.DRAFT);
        assertThat(created.postedDate()).isEqualTo(Instant.parse("2026-10-15T00:00:00Z"));
    }

    @Test
    @DisplayName("게시 예약: 게시일이 지금보다 과거면 400 INVALID_POSTED_DATE, 저장하지 않는다")
    void createEventWithPastPostedDate() {
        EventCreateRequest request = new EventCreateRequest(
                "예약 행사", null, 100, at("05:00"), at("08:00"), null, Instant.parse("2026-09-30T00:00:00Z"));

        assertThatThrownBy(() -> eventService.createEvent(request, 99L))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("INVALID_POSTED_DATE");
        verify(eventRepository, never()).save(any());
    }

    @Test
    @DisplayName("게시 예약: 게시일이 행사 시작 이후(진행 중)면 400 INVALID_POSTED_DATE")
    void createEventWithPostedDateAfterStart() {
        EventCreateRequest request = new EventCreateRequest(
                "예약 행사", null, 100, at("05:00"), at("08:00"), null, at("06:00"));

        assertThatThrownBy(() -> eventService.createEvent(request, 99L))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("INVALID_POSTED_DATE");
        verify(eventRepository, never()).save(any());
    }

    @Test
    @DisplayName("게시 예약: 게시일이 행사 시작 시각과 같아도 400 INVALID_POSTED_DATE")
    void createEventWithPostedDateEqualStart() {
        EventCreateRequest request = new EventCreateRequest(
                "예약 행사", null, 100, at("05:00"), at("08:00"), null, at("05:00"));

        assertThatThrownBy(() -> eventService.createEvent(request, 99L))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("INVALID_POSTED_DATE");
    }

    @Test
    @DisplayName("관리자가 직접 공개(DRAFT → OPEN)하면 게시일이 지금 시각으로 기록된다")
    void manualOpenRecordsPostedDate() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(seminar(null)));
        EventUpdateRequest request = new EventUpdateRequest(null, null, null, null, null, null, EventStatus.OPEN);

        EventResponse updated = eventService.updateEvent(eventId, OWNER_ID, request);

        assertThat(updated.status()).isEqualTo(EventStatus.OPEN);
        assertThat(updated.postedDate()).isEqualTo(Instant.parse("2026-10-01T00:00:00Z"));
    }

    @Test
    @DisplayName("이미 공개된 행사의 게시일을 바꾸면 409 EVENT_ALREADY_POSTED")
    void cannotChangePostedDateAfterOpen() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(openSeminar(null)));
        EventUpdateRequest request = new EventUpdateRequest(
                null, null, null, null, null, null, null, Instant.parse("2026-10-20T00:00:00Z"));

        assertThatThrownBy(() -> eventService.updateEvent(eventId, OWNER_ID, request))
                .isInstanceOf(BusinessException.class)
                .extracting("code").isEqualTo("EVENT_ALREADY_POSTED");
    }

    @Test
    @DisplayName("자동 공개: 지금 시각 기준으로 게시일이 지난 DRAFT를 OPEN으로 바꾸라고 요청한다")
    void openScheduledEventsUsesNow() {
        when(eventRepository.openScheduledEvents(EventStatus.DRAFT, EventStatus.OPEN, Instant.now(FIXED_CLOCK)))
                .thenReturn(1);

        assertThat(eventService.openScheduledEvents()).isEqualTo(1);
    }
}
