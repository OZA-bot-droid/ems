package com.ems.event.registration.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/** 신청 시점의 회원 정보를 Member Service에서 조회합니다. */
@Component
public class MemberProfileClient {
    private final RestClient restClient;
    private final String internalToken;

    public MemberProfileClient(RestClient.Builder builder,
                               @Value("${member-service.url}") String memberServiceUrl,
                               @Value("${ems.internal-token}") String internalToken) {
        this.restClient = builder.baseUrl(memberServiceUrl).build();
        this.internalToken = internalToken;
    }

    public ApplicantProfile findProfile(Long memberId) {
        MemberProfileEnvelope response = restClient.get()
                .uri("/members/internal/{memberId}/registration-profile", memberId)
                .header("X-Internal-Service-Token", internalToken)
                .retrieve()
                .body(MemberProfileEnvelope.class);
        return response == null ? null : response.data();
    }

    public record ApplicantProfile(Long memberId, String name, String email) { }

    // Member Service는 공통 성공 응답의 data 안에 회원 정보를 담아 반환합니다.
    private record MemberProfileEnvelope(
            boolean success, ApplicantProfile data, String message, int status,
            String timestamp, String path, String traceId) { }
}
