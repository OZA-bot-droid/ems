package com.ems.event.registration.entity;

/** 참가 신청의 진행 상태입니다. DB에는 enum 이름이 문자열로 저장됩니다. */
public enum RegistrationStatus {
    /** 신청 직후, 관리자의 승인 또는 거절을 기다리는 상태 */
    PENDING,
    /** 관리자가 참가를 승인한 상태 */
    APPROVED,
    /** 관리자가 참가를 거절한 상태 */
    REJECTED,
    /** 신청자가 신청을 취소한 상태 */
    CANCELLED
}
