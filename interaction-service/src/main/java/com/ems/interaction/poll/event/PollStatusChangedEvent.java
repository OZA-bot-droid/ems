package com.ems.interaction.poll.event;

import com.ems.interaction.poll.domain.Status;

// 투표 상태 변경 관련 레코드
public record PollStatusChangedEvent(Long pollId, Long sessionId, Status status) {
}
