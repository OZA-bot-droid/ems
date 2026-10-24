package com.ems.event.event;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class EventStatusTest {

    @Test
    @DisplayName("상태는 DRAFT → OPEN → CLOSED 순서로 바꿀 수 있다")
    void canMoveForward() {
        assertThat(EventStatus.DRAFT.canChangeTo(EventStatus.OPEN)).isTrue();
        assertThat(EventStatus.OPEN.canChangeTo(EventStatus.CLOSED)).isTrue();
    }

    @Test
    @DisplayName("상태를 그대로 두거나 보내지 않으면 허용한다")
    void sameOrNullIsAllowed() {
        assertThat(EventStatus.OPEN.canChangeTo(EventStatus.OPEN)).isTrue();
        assertThat(EventStatus.CLOSED.canChangeTo(null)).isTrue();
    }

    @Test
    @DisplayName("되돌리거나 단계를 건너뛸 수 없다")
    void cannotGoBackOrSkip() {
        assertThat(EventStatus.CLOSED.canChangeTo(EventStatus.DRAFT)).isFalse();
        assertThat(EventStatus.CLOSED.canChangeTo(EventStatus.OPEN)).isFalse();
        assertThat(EventStatus.OPEN.canChangeTo(EventStatus.DRAFT)).isFalse();
        assertThat(EventStatus.DRAFT.canChangeTo(EventStatus.CLOSED)).isFalse();
    }

    @Test
    @DisplayName("DRAFT는 일반 회원에게 보이지 않는다")
    void draftIsHiddenFromPublic() {
        assertThat(EventStatus.DRAFT.isVisibleToPublic()).isFalse();
        assertThat(EventStatus.OPEN.isVisibleToPublic()).isTrue();
        assertThat(EventStatus.CLOSED.isVisibleToPublic()).isTrue();
    }
}
