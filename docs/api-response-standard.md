# SYNC5 EMS — 공통 API 성공·오류 응답 표준

## 1. 목적과 적용 범위

Member, Event, Interaction 등 EMS의 REST API에 대해 **HTTP 상태 코드와 JSON 응답 구조를 일관되게 적용**한다. Gateway는 자체 오류만 표준 JSON으로 작성하고, 하위 서비스의 응답은 재포장하지 않는다.

- 외부 API 경로는 `/api/...`를 사용한다. 서비스 내부 경로는 Gateway의 `StripPrefix=1` 이후 `/members/...`, `/events/...` 등의 형태가 될 수 있다.
- HTTP 상태 코드가 성공/실패 여부의 **1차 기준**이다. JSON의 `success`, `status`는 실제 HTTP 상태와 일치해야 한다.
- 이 문서는 기존 `docs/api-contract.md`의 각 서비스 엔드포인트와 함께 적용한다. 기존 문서의 간단한 오류 구조 `{code,message,timestamp}`는 이 문서의 **확장된 공통 오류 구조**로 대체하는 것을 권장한다.
- WebSocket/STOMP 메시지, Actuator, 정적 파일, 파일 다운로드, 스트리밍, OAuth2 리다이렉트는 REST JSON 표준의 직접적인 래핑 대상이 아니다. 별도 프로토콜 계약을 따른다.

## 2. 공통 JSON 응답 계약

### 2.1 성공: HTTP 200 OK

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "success": true,
  "data": {
    "memberId": 15,
    "name": "홍길동",
    "email": "user@example.com"
  },
  "message": "요청 성공",
  "status": 200,
  "timestamp": "2026-11-03T14:00:00Z",
  "path": "/api/members/me",
  "traceId": null
}
```

- `data`는 API별 DTO, 목록 또는 페이지 객체이다. 의미상 반환할 데이터가 없다면 `null`을 허용하되, 그런 API에는 `204`가 더 적절한지 검토한다.
- `message`는 사람이 읽을 수 있는 짧은 성공 설명이다. 프론트엔드의 분기 조건으로 사용하지 않는다.
- 인증 API의 Access Token 응답은 `data.accessToken`에 둔다. Refresh Token은 응답 본문에 포함하지 않고 `HttpOnly` 쿠키로 발급한다.

**로그인·토큰 재발급의 200 응답 예시**

```json
{
  "success": true,
  "data": { "accessToken": "<JWT>" },
  "message": "요청 성공",
  "status": 200,
  "timestamp": "2026-11-03T14:00:00Z",
  "path": "/api/members/login",
  "traceId": null
}
```

### 2.2 생성: HTTP 201 Created

```http
HTTP/1.1 201 Created
Location: /api/events/42
Content-Type: application/json
```

```json
{
  "success": true,
  "data": { "eventId": 42 },
  "message": "행사 생성 완료",
  "status": 201,
  "timestamp": "2026-11-03T14:00:00Z",
  "path": "/api/events",
  "traceId": null
}
```

- 생성된 자원의 URI가 명확하면 `Location` 헤더를 함께 반환한다.
- 회원가입처럼 생성 결과를 노출하지 않는 정책을 택할 수 있다. 그 경우에도 HTTP 201을 유지하고 본문 제공 여부는 API 계약에 명시한다.

### 2.3 비동기 접수: HTTP 202 Accepted

```json
{
  "success": true,
  "data": { "jobId": "job-123", "state": "PENDING" },
  "message": "처리 요청 접수",
  "status": 202,
  "timestamp": "2026-11-03T14:00:00Z",
  "path": "/api/analytics/reports",
  "traceId": null
}
```

`202`는 처리가 **완료**됐다는 뜻이 아니라 요청이 **접수**됐다는 뜻이다. 완료 여부를 확인할 수 있는 식별자나 조회 경로를 제공하는 것을 권장한다.

### 2.4 본문 없는 성공: HTTP 204 No Content

```http
HTTP/1.1 204 No Content
```

- **본문을 절대 반환하지 않는다.** JSON 객체나 `success: true`도 넣지 않는다.
- `ResponseEntity.noContent().build()` 사용을 권장한다.
- 로그아웃은 현행 Member의 성공 JSON(`200`)을 유지할 수도 있다. `204`로 바꾸는 경우에는 프론트엔드와 API 계약을 함께 변경해야 한다.

### 2.5 오류: 4xx / 5xx

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json
```

```json
{
  "success": false,
  "code": "INVALID_TOKEN",
  "message": "유효하지 않은 인증 토큰입니다.",
  "status": 401,
  "timestamp": "2026-11-03T14:00:00Z",
  "path": "/api/members/me",
  "traceId": null
}
```

- 실패 응답에는 원칙적으로 `data`를 넣지 않는다. 대신 안정적인 기계 판독용 `code`를 제공한다.
- 클라이언트는 `message` 문구가 아니라 HTTP 상태와 `code`로 예외를 분기한다.
- 내부 예외 스택, 비밀번호, 토큰, SQL 상세 정보 등 민감한 값을 응답에 노출하지 않는다.
- 유효하지 않은 인증 정보는 `401`, 인증은 됐으나 권한이 부족하면 `403`을 사용한다.

### 2.6 필드 정의

| 필드 | 타입 | 성공 | 오류 | 규칙 |
| --- | --- | --- | --- | --- |
| `success` | boolean | `true` | `false` | HTTP 상태와 모순 금지 |
| `data` | JSON / null | 사용 | 생략 | 성공 API의 실제 반환 데이터 |
| `code` | string | 생략 | 필수 | `INVALID_TOKEN`, `VALIDATION_ERROR` 등의 안정적인 오류 코드 |
| `message` | string | 필수 | 필수 | 사용자 표시 또는 로깅용 설명 |
| `status` | integer | 필수 | 필수 | **실제 HTTP 응답 상태와 동일** |
| `timestamp` | string | 필수 | 필수 | UTC ISO 8601, 예: `2026-11-03T14:00:00Z` |
| `path` | string | 필수 | 필수 | 외부에서 호출한 `/api/...` 경로, 쿼리 제외 |
| `traceId` | string / null | 필수 | 필수 | 검증된 추적 ID가 없으면 `null`, 임의 조작 금지 |

`path`는 이미 `/api`로 시작하면 다시 접두어를 붙이지 않는다. 내부 경로가 `/members/me`라면 외부 경로 `/api/members/me`로 정규화한다. 프록시/서비스가 실제 외부 경로를 안전하게 전달할 수 있는지도 통합 테스트한다.

## 3. HTTP 상태 코드 선택 표준

| 상태 | 적용 시점 | EMS 사례 |
| --- | --- | --- |
| `200 OK` | 정상 조회·처리 완료, 데이터 반환 | 로그인, `/members/me`, Access 재발급, 승인 처리 |
| `201 Created` | 자원 생성 완료 | 회원가입, 행사·세션 생성 |
| `202 Accepted` | 비동기 작업 접수 | 대량 알림·리포트 생성 요청 |
| `204 No Content` | 성공하였으나 본문 불필요 | 삭제·취소·로그아웃(계약 선택 시) |
| `400 Bad Request` | 요청 구조·값 검증 실패 | 필수값 누락, UUID 형식 오류 |
| `401 Unauthorized` | 인증 누락·만료·위조 | Access Token 만료, 잘못된 Refresh Token |
| `403 Forbidden` | 인증은 됐으나 권한 없음 | 일반 사용자의 주최자 API 접근 |
| `404 Not Found` | 자원 없음 | 존재하지 않는 행사·회원 |
| `409 Conflict` | 현재 상태와 충돌 | 중복 이메일, 중복 신청, 상태 충돌 |
| `429 Too Many Requests` | 호출 제한 초과 | 로그인·재발급 남용 방지 |
| `500 Internal Server Error` | 예기치 않은 내부 오류 | 미처리 예외 |
| `502 Bad Gateway` | 상위 연동 서비스 오류 | 외부 OAuth API 연동 실패 |
| `503 Service Unavailable` | 서비스 이용 불가 | 일시적인 다운스트림 장애 |
| `504 Gateway Timeout` | 상위 서비스 응답 시간 초과 | Gateway 라우팅 타임아웃 |

**금지:** 실패했는데 `HTTP 200 + success: false`로 반환하거나, 성공했는데 `HTTP 401 + success: true`로 반환하는 방식.

## 4. 서비스별 책임

| 담당 | 책임 |
| --- | --- |
| Member | 로그인·회원 조회·Refresh Rotation 등 자체 성공/오류 응답 표준화 |
| Event | 행사·세션·참가 신청 및 승인 응답 표준화 |
| Interaction | 투표·결과 조회 등 REST 응답 표준화 (WebSocket 메시지는 별도 계약) |
| Gateway | 자체 JWT 인증 오류·라우팅 오류만 표준화하고, **하위 서비스 JSON을 다시 래핑하지 않음** |
| Frontend | `response.ok` / `response.status`로 HTTP 처리, JSON의 `data`와 `code`로 기능 처리 |

Gateway는 오류를 작성할 때 클라이언트가 요청한 외부 경로를 사용한다. 단순히 내부 서비스의 모든 실패를 Gateway의 500으로 치환하지 않는다. 정상적인 다운스트림 오류는 해당 HTTP 상태와 JSON을 유지한다.

## 5. Spring Boot 구현 규칙

### 5.1 성공·오류 DTO 유지

현재 Member의 `APISuccessResponse<T>` 및 `APIErrorResponse`와 동등한 구조를 모든 REST 서비스에 적용한다. 가능하면 별도 공통 모듈로 타입과 직렬화 정책을 공유하되, 공통 모듈 도입이 일정에 부담이면 각 서비스에서 같은 계약을 구현해도 된다.

### 5.2 ResponseBodyAdvice 구현 방식 (팀 권장: **명시적 DTO 우선**)

자동 래핑은 편리하지만 오류, 문자열, 리다이렉트, 204 응답의 충돌을 일으키기 쉽다. **신규 API는 Controller 또는 응답 팩토리에서 `APISuccessResponse<T>`를 명시적으로 생성**하는 것을 1순위로 권장한다.

기존의 자동 래핑을 당장 유지해야 하는 경우 다음 조건을 반드시 충족해야 한다.

1. 이미 `APISuccessResponse`이거나 `APIErrorResponse`이면 **재래핑 금지**.
2. HTTP 상태가 `2xx`가 아니면 성공 래핑 금지.
3. `204 No Content`, `205 Reset Content`, `304 Not Modified`에는 본문 생성 금지.
4. `StringHttpMessageConverter`에 전달되는 문자열, 파일·리소스·스트리밍, SSE, 리다이렉트, OAuth2 핸들러 응답은 자동 래핑에서 제외하거나 별도 직렬화 전략 사용.
5. `ResponseEntity<Void>` / `void` 반환과 상태별 본문 존재 여부를 테스트한다.
6. Spring Security 필터 단계에서 직접 작성된 401/403 JSON은 `ResponseBodyAdvice`가 자동으로 처리한다고 가정하지 않는다.
7. `path`는 중복 `/api/api/...`가 생기지 않도록 정규화한다.

**최소 예외 처리 코드 예시 (`beforeBodyWrite` 내부):**

```java
if (body instanceof APISuccessResponse<?> || body instanceof APIErrorResponse) {
    return body;
}

// 실제 status는 ServerHttpResponse에서 취득해야 함.
if (status < 200 || status >= 300 || status == 204 || status == 205) {
    return body;
}
```

이 코드만으로 자동 래핑 구현이 완성되는 것은 아니다. `supports()`에서의 메시지 컨버터 제외 및 빈 본문 응답 처리를 함께 구현해야 한다.

### 5.3 상태 지정

```java
// 조회 완료: 200
return ResponseEntity.ok(successBody);

// 생성 완료: 201
return ResponseEntity.created(resourceUri).body(successBody);

// 본문 없는 성공: 204
return ResponseEntity.noContent().build();

// 인증 오류: 401 — 공통 예외 핸들러/인증 진입점에서 작성
```

HTTP 상태를 200으로 설정한 채 `data.status=201` 또는 `data.status=401`로만 변경하지 않는다.

### 5.4 현재 develop에서 특히 수정해야 하는 사항

- `member-service/.../ResponseBodyAdviceImpl.java`는 `APISuccessResponse`만 재래핑에서 제외하므로 **`APIErrorResponse` 제외 및 성공 상태에 한정하는 방어 로직**이 필요하다.
- `APISuccessResponse`와 `APIErrorResponse`의 생성자는 `path = "/api" + path`를 수행하므로, **이미 `/api`인 경로의 중복 접두어 방지**가 필요하다.
- 기존 Member 로그인/재발급 응답은 `AccessTokenResponseDTO`를 성공 래퍼 안의 `data`에 넣는 계약으로 고정한다. OAuth 코드 교환 응답 역시 동일하다.
- 기존 `204` 반환 API가 있다면 `ResponseBodyAdvice` 적용 후에도 본문이 없는지 검증한다.
- 공통 오류 처리 시 `errorCode` 직렬화는 문자열 코드(예: `"INVALID_TOKEN"`)로 통일한다.

## 6. Frontend 구현 규칙

```javascript
async function requestJson(path, options = {}) {
  const response = await fetch(`/api${path}`, options);

  // 204는 JSON 본문이 없다.
  if (response.status === 204) return null;

  const body = await response.json();
  if (!response.ok) {
    const error = new Error(body.message || '요청 실패');
    error.status = response.status;
    error.code = body.code;
    throw error;
  }

  return body.data;
}
```

- **200/201/202**: `body.data` 사용.
- **204**: JSON 파싱을 생략.
- **401**: Access Token 만료로 판단 가능한 보호 API 요청에 한해 Refresh Token 재발급을 최대 한 번 시도하고 원래 요청을 재시도한다. 로그인 실패·재발급 실패 자체는 자동 재발급 재귀 호출 금지.
- **403**: 재발급하지 않고 권한 부족으로 처리.
- **409**: 중복·상태 충돌 안내.
- **5xx**: 서비스 오류 안내 및 필요 시 안전한 재시도. 무조건 반복 요청 금지.
- 인증 응답에서 `res.text()`로 JWT 원문을 읽지 않는다. 공통 응답의 `data.accessToken`을 사용한다.
- 여러 API 요청이 동시에 401을 받으면 Refresh Rotation 재사용 탐지를 유발하지 않도록 **단일 재발급(Single-flight)** 으로 합친다.

## 7. 자동화 테스트 / 통합 승인 기준

| 테스트 ID | 요청 상황 | 기대 HTTP | 기대 본문 |
| --- | --- | --- | --- |
| API-001 | 유효한 Access Token으로 `/api/members/me` | 200 | `success=true`, `data` 존재, `status=200` |
| API-002 | 로그인 성공 | 200 | `data.accessToken` 존재, Refresh 쿠키 설정 |
| API-003 | 행사 생성 성공 | 201 | `success=true`, `status=201`, 가능하면 `Location` |
| API-004 | 본문 없는 삭제 성공 | 204 | **응답 본문 없음** |
| API-005 | Access Token 만료 또는 서명 오류 | 401 | `success=false`, `code=INVALID_TOKEN` 계열 |
| API-006 | 유효한 USER가 ADMIN 전용 API 호출 | 403 | `success=false`, `code=FORBIDDEN` |
| API-007 | 유효성 검증 실패 | 400 | `success=false`, `code=VALIDATION_ERROR` |
| API-008 | 중복 이메일 | 409 | `success=false`, 중복 관련 `code` |
| API-009 | Member 오류 응답 | 원래 4xx/5xx | `APISuccessResponse` 중첩 없음 |
| API-010 | Gateway 생성 오류 | 401/403/5xx 등 | 동일 오류 JSON 필드, 외부 `/api` 경로 |
| API-011 | `ResponseEntity<Void>`와 String 응답 | 원래 상태 | 직렬화 실패·강제 재래핑 없음 |
| API-012 | 프론트 토큰 자동 재발급 | 401 → 재발급 200 → 재시도 200 | 최종 요청 성공, 무한 루프 없음 |

**배포 차단 조건:** 동일 요청에서 실제 HTTP 상태와 JSON `status` 불일치, `HTTP 200 + success=false`, 오류 응답의 성공 래핑, 204의 본문 존재, 로그인/재발급 응답 파싱 실패.

## 8. 적용 순서 및 커밋 안내

1. 이 문서를 `docs/api-response-standard.md`로 커밋하고 팀 공통 규격으로 공유한다.
2. `Member`의 `ResponseBodyAdviceImpl`, 성공/오류 DTO 경로 정규화, Spring Security 401/403 직렬화를 수정한다.
3. `Event`, `Interaction`에 동일 규격을 적용하고 Gateway는 자체 오류만 작성하도록 유지한다.
4. `feature/member-front` 등 Frontend의 로그인·재발급 파싱을 `data.accessToken` 기준으로 맞춘다.
5. API-001~012를 자동화하거나 통합테스트 체크리스트로 검증한 뒤 `main` 병합을 승인한다.

**권장 커밋 메시지:**

```text
docs: standardize EMS API success and error responses
```

> **주의**: 이 문서는 API 표준과 수정 지침이다. 문서만 커밋해도 Java/React의 현재 동작이 변경되지는 않는다. 구현 후 CI와 실제 HTTP/DB 통합 테스트가 별도로 필요하다.
