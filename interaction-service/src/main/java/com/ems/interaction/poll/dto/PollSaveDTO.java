package com.ems.interaction.poll.dto;

import com.ems.interaction.poll.domain.Poll;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.Instant;
import java.util.List;


@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PollSaveDTO {

    @NotBlank
    @Size(max = 255)
    private String title;

    @NotNull
    private Long eventId;

    @NotNull
    private Long sessionId;

    @NotNull
    private Boolean showLiveResults;

    @NotNull
    private Instant startsAt;

    @NotNull
    private Instant endsAt;

    @NotNull
    @Size(min = 2, message = "선택지는 최소 2개 필요합니다.")
    private List<@Valid OptionDTO> options;

    // 요청 DTO → Poll Entity 변환
    public Poll toEntity(Long userId) {
        return Poll.builder()
                .title(this.title.trim())
                .userId(userId)
                .eventId(this.eventId)
                .sessionId(this.sessionId)
                .startsAt(this.startsAt)
                .endsAt(this.endsAt)
                .showLiveResults(this.showLiveResults)
                .build();
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OptionDTO {

        @NotBlank
        @Size(max = 255)
        private String content;
    }
}