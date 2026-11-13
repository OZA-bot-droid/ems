package com.ems.member.member.dto;

/** Event Service에 참가 신청 당시 저장할 회원 정보입니다. */
public record RegistrationApplicantProfile(Long memberId, String name, String email) { }
