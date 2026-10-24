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

    /** 일반 회원에게 보이는 상태인가? (DRAFT는 관리자에게만 보임) */
    public boolean isVisibleToPublic() {
        return this != DRAFT;
    }

    /**
     * 이 상태에서 next로 바꿀 수 있는가?
     * 허용: 그대로 유지, DRAFT → OPEN, OPEN → CLOSED (되돌리기와 건너뛰기는 금지)
     */
    public boolean canChangeTo(EventStatus next) {
        if (next == null || next == this) {
            return true;
        }
        return (this == DRAFT && next == OPEN) || (this == OPEN && next == CLOSED);
    }
}
