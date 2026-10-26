package com.ems.event.event;

/* 흐름: DRAFT → OPEN → CLOSED*/
public enum EventStatus {
    /** 작성 중. 관리자에게만 보이고 신청 불가 */
    DRAFT,
    /** 공개됨. 참가 신청 가능 */
    OPEN,
    /** 신청 마감. 공개는 유지하지만 신청 불가 */
    CLOSED;

    public boolean isRegistrationOpen() {
        return this == OPEN;
    }

//  draft를 제외하고는 user에게 다 보여줌
    public boolean isVisibleToPublic() {
        return this != DRAFT;
    }

// status창이 순서대로 바뀌는거는 괜찮으나, 역순은 불가
    public boolean canChangeTo(EventStatus next) {
        if (next == null || next == this) {
            return true;
        }
        return (this == DRAFT && next == OPEN) || (this == OPEN && next == CLOSED);
    }
}
