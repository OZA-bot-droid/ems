package com.ems.interaction.poll.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

import com.ems.interaction.common.event.EventAuthorizationClient;
import com.ems.interaction.common.exception.ApiException;
import com.ems.interaction.poll.dto.PollSaveDTO;
import com.ems.interaction.poll.repository.PollOptionRepository;
import com.ems.interaction.poll.repository.PollRepository;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

class PollAuthorizationTest {
    private PollRepository polls;
    private PollOptionRepository options;
    private EventAuthorizationClient events;
    private PollService service;

    @BeforeEach
    void setup() {
        polls = mock(PollRepository.class);
        options = mock(PollOptionRepository.class);
        events = mock(EventAuthorizationClient.class);
        service = new PollService(polls, options, mock(ApplicationEventPublisher.class), events);
    }

    private PollSaveDTO request() {
        Instant start = Instant.now().plusSeconds(3600);
        return PollSaveDTO.builder()
            .eventId(11L).sessionId(22L)
            .title("클라우드 선호도 조사")
            .startsAt(start)
            .endsAt(start.plusSeconds(600))
            .showLiveResults(true)
            .options(List.of(new PollSaveDTO.OptionDTO("A"), new PollSaveDTO.OptionDTO("B")))
            .build();
    }

    @Test
    void nonOwnerCannotCreateEvenWithAdminRoleAtController() {
        when(events.eventAccess(11L, 55L))
            .thenReturn(new EventAuthorizationClient.EventAccess(11L, false, true, "OPEN"));
        assertThrows(ApiException.class, () -> service.createPoll(request(), 55L));
        verifyNoInteractions(polls, options);
    }

    @Test
    void eventSessionMustExistAndContainPollPeriod() {
        when(events.eventAccess(11L, 55L))
            .thenReturn(new EventAuthorizationClient.EventAccess(11L, true, false, "OPEN"));
        Instant start = Instant.now().plusSeconds(7200);
        when(events.session(11L, 22L))
            .thenReturn(new EventAuthorizationClient.SessionInfo(22L, 11L, start, start.plusSeconds(600)));
        assertThrows(ApiException.class, () -> service.createPoll(request(), 55L));
        verifyNoInteractions(polls, options);
    }

    @Test
    void eventAuthorizationFailureStopsPollCreation() {
        when(events.eventAccess(11L, 55L)).thenThrow(new ApiException(
            com.ems.interaction.common.exception.ErrorCode.SERVICE_UNAVAILABLE));
        assertThrows(ApiException.class, () -> service.createPoll(request(), 55L));
        verifyNoInteractions(polls, options);
    }
}
