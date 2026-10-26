package com.ems.interaction.poll.dto;


import com.ems.interaction.poll.domain.Poll;
import com.ems.interaction.poll.domain.PollOption;
import com.ems.interaction.poll.domain.Status;
import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PollResponseDTO {

    private Long id;
    private String title;
    private Long userId;
    private Long eventId;
    private UUID sessionId;
    private Status status;
    private Boolean showLiveResults;
    private Instant startsAt;
    private Instant endsAt;
    private List<OptionResponseDTO> options;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OptionResponseDTO {

        private Long id;
        private String content;
        private Integer displayOrder;
    }

    // 응답 DTO 변환
    public static PollResponseDTO from(Poll poll, List<PollOption> options) {
        List<OptionResponseDTO> optionResponses = options.stream().map(
                                        option -> OptionResponseDTO.builder()
                                                .id(option.getId())
                                                .content(option.getContent())
                                                .displayOrder(option.getDisplayOrder())
                                                .build())
                                                .toList();

        return PollResponseDTO.builder()
                .id(poll.getId())
                .title(poll.getTitle())
                .userId(poll.getUserId())
                .eventId(poll.getEventId())
                .sessionId(poll.getSessionId())
                .status(poll.getStatus())
                .startsAt(poll.getStartsAt())
                .endsAt(poll.getEndsAt())
                .showLiveResults(poll.isShowLiveResults())
                .options(optionResponses)
                .build();
    }
}