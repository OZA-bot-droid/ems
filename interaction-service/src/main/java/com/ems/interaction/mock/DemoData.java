
package com.ems.interaction.mock;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@Profile("local") // 개발 환경 전용. 운영 환경에서는 등록하지 않음
public class DemoData {

    public record DemoMember(
            Long id,
            String name,
            String email,
            String role
    ) {}

    public record DemoEvent(
            Long id,
            String title,
            Long createdBy
    ) {}

    public record DemoSession(
            Long id,
            Long eventId,
            String title
    ) {}

    public record DemoRegistration(
            Long userId,
            Long eventId,
            Long sessionId,
            String status
    ) {}

    // 회원 4명
    public final Map<Long, DemoMember> members = Map.of(
            1L, new DemoMember(1L, "관리자 1", "admin1@test.com", "ADMIN"),
            2L, new DemoMember(2L, "관리자 2", "admin2@test.com", "ADMIN"),
            3L, new DemoMember(3L, "사용자 1", "user1@test.com", "USER"),
            4L, new DemoMember(4L, "사용자 2", "user2@test.com", "USER")
    );

    // 행사 2개
    public final Map<Long, DemoEvent> events = Map.of(
            100L, new DemoEvent(100L, "클라우드 개발 컨퍼런스", 1L),
            200L, new DemoEvent(200L, "AI 서비스 개발 세미나", 2L)
    );

    // 세션 3개
    public final Map<Long, DemoSession> sessions = Map.of(
            101L, new DemoSession(101L, 100L, "Spring Boot와 MSA"),
            102L, new DemoSession(102L, 100L, "React와 프론트엔드"),
            201L, new DemoSession(201L, 200L, "AI 서비스 개발")
    );

    // 세션별 참가 승인 4건
    public final List<DemoRegistration> registrations = List.of(
            new DemoRegistration(3L, 100L, 101L, "APPROVED"),
            new DemoRegistration(3L, 100L, 102L, "APPROVED"),
            new DemoRegistration(4L, 100L, 102L, "APPROVED"),
            new DemoRegistration(4L, 200L, 201L, "APPROVED")
    );
}
