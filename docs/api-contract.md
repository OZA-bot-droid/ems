# 서비스별 API 계약 초안

공통: prefix `/api`, UTC ISO-8601 시간, Bearer JWT, 오류 응답 `{code,message,timestamp}`. CORS Origin 허용 목록과 Gateway path rewrite/StripPrefix를 통합 테스트로 확인.

## Member Service (P0)
- POST /api/members/register (공개)
- POST /api/members/login (공개)
- GET /api/members/me (인증 회원)
- GET /api/members (ADMIN, 추후)

## Event Service (P0 — 신청 기능 포함)
- GET /api/events (공개, 페이징)
- POST /api/events (ADMIN)
- GET /api/events/{eventId} (공개)
- PATCH /api/events/{eventId} (ADMIN)
- DELETE /api/events/{eventId} (ADMIN)
- POST /api/events/{eventId}/sessions (ADMIN)
- GET /api/events/{eventId}/sessions (공개)
- POST /api/events/{eventId}/registrations (USER)
- GET /api/events/registrations/me (USER)
- PATCH /api/events/registrations/{registrationId}/approve (ADMIN)
- PATCH /api/events/registrations/{registrationId}/reject (ADMIN)
- PATCH /api/events/registrations/{registrationId}/cancel (신청자/ADMIN)
- GET /api/events/{eventId}/summary (ADMIN, P0 기본 통계)

## Interaction Service (P0)
- POST /api/interactions/polls (ADMIN)
- POST /api/interactions/polls/{pollId}/votes (승인 회원)
- GET /api/interactions/polls/{pollId}/results (권한 보유자)
- WS /ws/interactions (인증 및 세션별 구독 권한 확인)
- SUB /topic/sessions/{sessionId}/polls/{pollId} (허가받은 구독)

## Notification Service (P1)
- GET /api/notifications/me
- PATCH /api/notifications/{id}/read
- POST /api/notifications/dispatch (서버 내부, 인증 필수)

## Analytics Service (P1)
- GET /api/analytics/events/{eventId}
- GET /api/analytics/reports/overview

## Integration Service (P1)
- POST /api/integrations/meetings (ADMIN)
- GET /api/integrations/meetings/{meetingId} (인가된 참가자)
- PATCH /api/integrations/meetings/{meetingId} (ADMIN)

서비스 간 통신은 인증, 실패 재시도, timeout, 소유권 검사를 요구. API 경로/DTO는 코딩 시작 전에 5인 팀이 확정.
