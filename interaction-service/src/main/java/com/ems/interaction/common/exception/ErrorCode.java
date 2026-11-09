package com.ems.interaction.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // ===== 공통 오류 =====

    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "요청 입력값을 확인해 주세요."),

    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "요청 형식이나 입력값이 올바르지 않습니다."),

    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "인증이 필요합니다."),

    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않은 인증 토큰입니다."),

    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "요청한 리소스를 찾을 수 없습니다."),

    DUPLICATE_RESOURCE(HttpStatus.CONFLICT, "이미 존재하는 리소스입니다."),

    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다."),

    UPSTREAM_SERVICE_ERROR(HttpStatus.BAD_GATEWAY, "외부 서비스의 응답이 올바르지 않습니다."),

    SERVICE_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "서비스를 일시적으로 이용할 수 없습니다."),

    UPSTREAM_TIMEOUT(HttpStatus.GATEWAY_TIMEOUT, "외부 서비스의 응답 시간이 초과되었습니다."),

    // ===== Interaction 전용 오류 =====

    //존재하지 않는 투표 오류
    POLL_NOT_FOUND(HttpStatus.NOT_FOUND, "투표를 찾을 수 없습니다."),

    //투표에 없는 선택지 오류
    INVALID_POLL_OPTION(HttpStatus.BAD_REQUEST, "해당 투표에 속하지 않는 선택지입니다."),

    //타인의 행사 오류
    EVENT_OWNER_REQUIRED(HttpStatus.FORBIDDEN, "해당 행사의 소유자 권한이 필요합니다."),

    //참가 권한 없는 유저 투표 오류
    REGISTRATION_NOT_APPROVED(HttpStatus.FORBIDDEN, "참가 승인된 사용자만 투표할 수 있습니다."),

    //투표 비활성화 상태, 종료된 투표
    POLL_NOT_ACTIVE(HttpStatus.CONFLICT, "현재 참여할 수 없는 투표입니다."),

    //중복 투표 오류
    ALREADY_VOTED(HttpStatus.CONFLICT, "이미 참여한 투표입니다."),

    //투표 시작·종료 시간 검증
    INVALID_PERIOD(HttpStatus.BAD_REQUEST, "투표 기간이 올바르지 않습니다."),

    //투표 상태 전이 충돌
    INVALID_STATUS_CHANGE(HttpStatus.CONFLICT, "투표 상태 변경 도중 충돌이 발생했습니다."),

    //일반 유저가 관리자 권한 있는 기능 요청시
    FORBIDDEN(HttpStatus.FORBIDDEN, "권한이 없습니다.");



    private final HttpStatus status;
    private final String message;
}