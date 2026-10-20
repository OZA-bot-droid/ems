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
}
