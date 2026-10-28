# SYNC5 EMS — API 계약 및 공통 오류 응답 규격

- 문서 상태: **1차 통합테스트용 팀 표준 제안본 (승인 후 확정)**
- 작성 기준일: 2026-10-28
- 적용 범위: Gateway, Member Service, Event Service, Interaction Service
- 원본 기준: `docs/api-contract.md`

> 이 문서는 기존 API 계약 항목을 보존하면서 오류 응답을 표준화한 통합 문서다. 새로운 응답 스키마 및 오류 코드는 적용 목표이며, 현재 모든 서비스에 구현되었다는 의미는 아니다.

## 1. 공통 API 계약

- 외부 API prefix: `/api`
- 시간 표기: UTC ISO 8601 (예: `2026-10-28T05:30:00Z`)
- 인증: `Authorization: Bearer <access-token>`; 공개 API 제외
- JWT 서명: RS256. `sub` = Member ID(BIGINT를 문자열로 표현), `role` = `USER` 또는 `ADMIN`, `token_type` = `access`, `iss` = `ems-auth`
- Gateway → 서비스 내부 신뢰 헤더: `X-Member-Id`, `X-User-Role`. 외부 요청에 포함된 `X-Member-Id`, `X-User-Role`, `X-User-Id`는 먼저 제거한다.
- CORS Origin 허용 목록, Gateway `StripPrefix=1`, 요청·응답 경로와 쿠키 Path를 통합테스트에서 확인한다.
- `ADMIN`은 **행사 주최자 역할**이다. 타인의 행사에 대한 관리 권한을 자동으로 갖지 않는다.
- 서비스 간 참조 ID는 BIGINT/Java Long. DB 간 FK를 만들지 않고, API 호출로 존재·소유권·참가 상태를 검증한다.
- 정상 응답은 서비스별 기존 DTO를 유지한다. **오류 응답만** 공통 스키마로 표준화한다.

## 2. 표준 오류 응답 (필수)

**HTTP 응답**: 실제 오류에 대응하는 4xx 또는 5xx 상태 코드와 `Content-Type: application/json`.

```json
{
  "success": false,
  "code": "EVENT_NOT_FOUND",
  "message": "행사를 찾을 수 없습니다.",
  "status": 404,
  "timestamp": "2026-10-28T05:30:00Z",
  "path": "/api/events/999",
  "traceId": "a83f0d219bc74e0a"
}
```

| 필드 | 타입 | 의무 | 규칙 |
|---|---|---|---|
| `success` | boolean | 필수 | 항상 `false` |
| `code` | string | 필수 | 안정적인 UPPER_SNAKE_CASE 오류 식별자 |
| `message` | string | 필수 | 사용자가 이해할 수 있는 안전한 문구; 내부 예외·SQL·토큰 노출 금지 |
| `status` | integer | 필수 | 실제 HTTP 상태와 반드시 일치 |
| `timestamp` | string | 필수 | UTC ISO 8601 |
| `path` | string | 필수 | 외부 요청의 `/api/...` 경로; 쿼리/민감정보 제외 |
| `traceId` | string/null | 권장 | 요청 전체에서 동일한 추적 ID. 추적 ID가 없다면 `null` 허용. 임의로 가짜 생성 금지 |

`traceId`는 단계적 도입이 가능하며, 프런트엔드는 부재해도 오류를 처리할 수 있어야 한다. 경로·메시지에는 개인정보를 넣지 않는다. 필드 추가는 하위 호환성 유지, 필드 삭제·이름 변경은 팀 합의가 필요하다.

## 3. 공통 HTTP 상태 기준

| HTTP | 기본 코드 | 적용 원칙 |
|---|---|---|
| 400 | `VALIDATION_ERROR`, `INVALID_REQUEST` | 누락·형식·입력 범위 오류 |
| 401 | `UNAUTHORIZED`, `INVALID_TOKEN` | 인증 없음, 서명/만료/유형 오류 |
| 403 | `FORBIDDEN`, `EVENT_OWNER_REQUIRED` | 인증은 됐지만 역할·소유권·참가 권한 부족 |
| 404 | `RESOURCE_NOT_FOUND` | 리소스 미존재 |
| 409 | `DUPLICATE_RESOURCE`, `INVALID_STATUS_CHANGE` | 중복·상태 충돌·정원 초과 |
| 500 | `INTERNAL_SERVER_ERROR` | 예상 못 한 내부 예외; 상세 정보 노출 금지 |
| 502 | `UPSTREAM_SERVICE_ERROR` | 의존 서비스의 잘못된 응답 |
| 503 | `SERVICE_UNAVAILABLE` | 의존 서비스 이용 불가 |
| 504 | `UPSTREAM_TIMEOUT` | 의존 서비스 타임아웃 |

`401`과 `403`을 혼용하지 않는다. 서비스 호출의 실패를 무조건 500으로 매핑하지 않는다. 위 기본 코드는 아래 서비스별 세부 코드로 구체화한다.

## 4. 서비스별 오류 코드

### 4.1 Gateway

| 상황 | HTTP | code |
|---|---:|---|
| Bearer Access Token 누락 | 401 | `UNAUTHORIZED` |
| 서명 불일치·만료·발급자 불일치 | 401 | `INVALID_TOKEN` |
| Refresh Token으로 일반 API 접근 | 401 | `INVALID_TOKEN` |
| `sub`가 양수 BIGINT로 해석되지 않음 | 401 | `INVALID_TOKEN` |
| `role` 누락·미허용 값 | 401 | `INVALID_TOKEN` |
| 백엔드 이용 불가 | 503 | `SERVICE_UNAVAILABLE` |
| 백엔드 시간 초과 | 504 | `UPSTREAM_TIMEOUT` |

Gateway `JwtAuthenticationFilter.unauthorized()`는 현재 상태 코드만 반환하므로 JSON 형식으로 수정한다. Gateway는 WebFlux 기반으로 MVC `HttpServletRequest`를 직접 사용하지 않는다.

### 4.2 Member Service

| 상황 | HTTP | code |
|---|---:|---|
| 이메일 중복 | 409 | `MEMBER_EMAIL_DUPLICATED` |
| 가입 DTO 형식 오류 | 400 | `VALIDATION_ERROR` |
| 이메일 또는 비밀번호 불일치 | 401 | `INVALID_CREDENTIALS` |
| 회원 미존재 | 404 | `MEMBER_NOT_FOUND` |
| Refresh Token 만료·위조·DB 기록 불일치 | 401 | `INVALID_REFRESH_TOKEN` |
| Refresh Token 재사용 탐지 | 401 | `REFRESH_TOKEN_REUSED` |
| 유효하지 않은 가입 역할 | 400 | `INVALID_ROLE` |

보안상 로그인 오류에서는 이메일 존재 여부와 비밀번호 오류를 구별해 노출하지 않는다. Refresh Token 재사용 탐지 코드는 탐지 기능이 구현된 경우에만 사용한다.

### 4.3 Event Service

| 상황 | HTTP | code |
|---|---:|---|
| 행사 없음 | 404 | `EVENT_NOT_FOUND` |
| 세션 없음 | 404 | `SESSION_NOT_FOUND` |
| USER의 ADMIN 전용 기능 접근 | 403 | `FORBIDDEN` |
| 다른 주최자 행사 수정·삭제·승인 | 403 | `EVENT_OWNER_REQUIRED` |
| 행사·세션 기간 형식 불일치 | 400 | `INVALID_PERIOD` |
| 세션이 행사 시간 밖 | 400 | `SESSION_OUT_OF_EVENT` |
| 세션 시간 겹침 | 409 | `SESSION_TIME_CONFLICT` |
| 허용되지 않은 상태 변경 | 409 | `INVALID_STATUS_CHANGE` |
| 신청 불가 상태의 행사 | 409 | `EVENT_NOT_OPEN` |
| 중복 참가 신청 | 409 | `ALREADY_REGISTERED` |
| 참가 신청 정보 없음 | 404 | `REGISTRATION_NOT_FOUND` |
| 정원 초과 | 409 | `CAPACITY_EXCEEDED` |

### 4.4 Interaction Service

| 상황 | HTTP | code |
|---|---:|---|
| Poll 없음 | 404 | `POLL_NOT_FOUND` |
| Poll 소속이 아닌 선택지 | 400 | `INVALID_POLL_OPTION` |
| 일반 USER의 관리자 API 호출 | 403 | `FORBIDDEN` |
| 타인 행사에 Poll 생성·조작 | 403 | `EVENT_OWNER_REQUIRED` |
| 승인되지 않은 참가자 투표 | 403 | `REGISTRATION_NOT_APPROVED` |
| 투표가 활성화되지 않았거나 시간이 지남 | 409 | `POLL_NOT_ACTIVE` |
| 같은 회원의 중복 투표 | 409 | `ALREADY_VOTED` |
| Poll 상태 전이 충돌 | 409 | `INVALID_STATUS_CHANGE` |
| Poll 기간 오류 | 400 | `INVALID_PERIOD` |

## 5. API 경로 계약 (기존 문서 유지·보완)

### Member Service (P0)

- `POST /api/members/register` (공개)
- `POST /api/members/login` (공개)
- `POST /api/members/reissue` (Refresh Token 쿠키)
- `DELETE /api/members/logout` (Refresh Token 쿠키)
- `GET /api/members/me` (인증 회원)
- `GET /api/members` (ADMIN, 추후)

### Event Service (P0 — 신청 포함)

- `GET /api/events` (공개, 페이징)
- `POST /api/events` (ADMIN)
- `GET /api/events/{eventId}` (공개)
- `PATCH /api/events/{eventId}` (해당 행사 주최자)
- `DELETE /api/events/{eventId}` (해당 행사 주최자)
- `POST /api/events/{eventId}/sessions` (해당 행사 주최자)
- `GET /api/events/{eventId}/sessions` (공개)
- `PATCH /api/events/{eventId}/sessions/{sessionId}` (해당 행사 주최자)
- `DELETE /api/events/{eventId}/sessions/{sessionId}` (해당 행사 주최자)
- `POST /api/events/{eventId}/registrations` (인증 회원, 행사 OPEN)
- `GET /api/events/registrations/me` (인증 회원)
- `PATCH /api/events/registrations/{registrationId}/approve` (해당 행사 주최자)
- `PATCH /api/events/registrations/{registrationId}/reject` (해당 행사 주최자)
- `PATCH /api/events/registrations/{registrationId}/cancel` (신청자/해당 행사 주최자; 정책 확정 필요)
- `GET /api/events/{eventId}/summary` (해당 행사 주최자)

### Interaction Service (P0)

- `POST /api/interactions/polls` (해당 행사 주최자)
- `GET /api/interactions/polls/{pollId}` (현재 구현)
- `PATCH /api/interactions/polls/{pollId}/activate` (해당 행사 주최자; 구현 필요)
- `PATCH /api/interactions/polls/{pollId}/close` (해당 행사 주최자; 구현 필요)
- `POST /api/interactions/polls/{pollId}/votes` (승인 회원)
- `GET /api/interactions/polls/{pollId}/results` (권한 보유자; 구현 상태 확인 필요)
- `WS /ws/interactions` (인증 및 세션별 구독 권한 확인; 후속)
- `SUB /topic/sessions/{sessionId}/polls/{pollId}` (허가받은 구독; 후속)

### Notification Service (P1)

- `GET /api/notifications/me`
- `PATCH /api/notifications/{id}/read`
- `POST /api/notifications/dispatch` (서버 내부, 인증 필수)

### Analytics Service (P1)

- `GET /api/analytics/events/{eventId}`
- `GET /api/analytics/reports/overview`

### Integration Service (P1)

- `POST /api/integrations/meetings` (ADMIN)
- `GET /api/integrations/meetings/{meetingId}` (인가된 참가자)
- `PATCH /api/integrations/meetings/{meetingId}` (ADMIN)

## 6. 구현 책임과 보안

- **팀장 / Gateway**: JWT 누락·위조·만료·타입 오류 시 공통 401 JSON, 신뢰 헤더 재생성, 프록시 실패 응답 표준화.
- **Member**: 로그인/가입/재발급 관련 예외 표준화, JWT `role` 클레임 발급.
- **Event (행사·세션)**: `BusinessException`/`ResponseStatusException` 공통 변환, 생성자 소유권 검사.
- **Event (참가 신청)**: 중복 신청·정원·상태 전이·소유권 오류 표준화.
- **Interaction**: `IllegalArgumentException`을 상황별 400/404/409로 변환, 중복 투표 409 처리.
- **공통**: 예상하지 못한 500 예외는 서버 로그에 원인을 남기되 요청자에게 스택 트레이스·SQL·키·토큰 노출 금지.
- **Spring Security**: MVC `@RestControllerAdvice`만으로 모든 인증 오류를 처리할 수 없으므로, `AuthenticationEntryPoint`와 `AccessDeniedHandler`도 일관된 JSON을 반환하도록 검토.
- **네트워크 보안**: 내부 서비스가 Gateway를 우회해 외부 헤더를 직접 수신하지 않도록 제한.
- **추적 ID**: Gateway에서 요청당 단일 ID 생성/수용 정책을 정하고 위조 가능한 외부 trace 헤더는 신뢰하지 않음. 서비스 간 동일 ID 전파.

## 7. 1차 통합테스트 합격 기준

1. 토큰 누락·만료·변조 → **401 JSON**.
2. USER의 ADMIN API 호출 → **403 JSON**.
3. 타 행사 주최자 권한 행사 → **403 `EVENT_OWNER_REQUIRED`**.
4. 미존재 행사·투표 → **404 JSON**.
5. 중복 참가 신청 → **409 `ALREADY_REGISTERED`**.
6. 중복 투표 → **409 `ALREADY_VOTED`**.
7. DTO 필수값/형식 오류 → **400 `VALIDATION_ERROR`**.
8. 모든 4xx/5xx의 `success`, `code`, `message`, `status`, `timestamp`, `path` 일치.
9. `status` 필드와 실제 HTTP 상태 일치. 내부 예외 정보 노출 없음.
10. 미구현 API는 성공한 것으로 간주하지 않음. 코드 반영·빌드·실행 검증을 분리해 기록.

## 8. 변경 관리 규칙

- 변경 시 우선 오류 코드 및 HTTP 상태 표를 갱신한 다음 서비스 구현에 반영한다.
- 클라이언트는 사용자에게 `message`를 표시하고, 분기 처리는 `code`로 수행한다.
- 기존 오류 코드의 의미를 임의로 변경하지 않는다.
- 공통 규격 변경은 팀 전체 리뷰 후 적용한다.
- 서비스별 Flyway Migration 변경은 기존 적용 파일을 보존하고 신규 버전을 추가한다.
