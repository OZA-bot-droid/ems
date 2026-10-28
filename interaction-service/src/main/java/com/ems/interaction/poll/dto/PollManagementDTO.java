package com.ems.interaction.poll.dto;

import com.ems.interaction.poll.domain.Poll;
import com.ems.interaction.poll.domain.Status;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PollManagementDTO {
    //

    private Long id;
    private String title;
    private Long userId;
    private Long eventId;
    private Long sessionId;
    private Status status;
    private Boolean showLiveResults;
    private Instant startsAt;
    private Instant endsAt;
    boolean canActivate;
    boolean canClose;

    public static PollManagementDTO from(Poll poll, Instant now) {
        return PollManagementDTO.builder()
                .id(poll.getId())
                .title(poll.getTitle())
                .userId(poll.getUserId())
                .eventId(poll.getEventId())
                .sessionId(poll.getSessionId())
                .status(poll.getStatus())
                .showLiveResults(poll.isShowLiveResults())
                .startsAt(poll.getStartsAt()).endsAt(poll.getEndsAt())
                .canActivate(poll.canActivate(now))
                .canClose(poll.canClose())
                .build();
    }
}
