# SYNC5 EMS — Frontend 구조 및 통합 개발 표준(안)
 
> **작성 기준일:** 2026-11-05  
> **범위:** React SPA의 폴더 구조, Axios 기반 HTTP 계층, 인증, 라우팅, 서비스별 책임, 기존 코드 이전 및 검증  
> **비범위:** 백엔드 소스 수정, Git 브랜치 변경 및 커밋, 실제 UI 기능 구현

## 1. 개요 및 결론

현재 EMS는 Member / Event / Interaction 백엔드를 별도 서비스로 운영하되 프론트엔드는 **단일 React SPA**로 구성한다. 프론트엔드는 별도의 프로젝트로 나누지 않고, **기능별(`features/`) 디렉터리 + 공통 인프라 계층(`app/`, `api/`, `components/`)**을 채택한다.

핵심 결정 제안:

1. `features/member/`, `features/event/`, `features/interaction/`을 각 기능 소유 경계로 사용한다.
2. REST 통신은 공통 Axios 클라이언트로 일관되게 처리하고, 서비스별 엔드포인트는 각 기능의 `api/`에 둔다.
3. Access Token은 프론트 인증 상태에서 관리하고, Refresh Token은 **HttpOnly 쿠키** 정책을 유지한다.
4. 여러 요청에서 401이 발생해도 Refresh 요청을 **동시에 한 번만** 수행(single-flight)하도록 한다.
5. 앱 라우터는 `app/router.jsx`에서 관리하고 `main.jsx`는 진입점 역할만 맡는다.
6. Axios는 일반 REST 전용이다. WebSocket/STOMP, OAuth 리다이렉트, 파일·스트리밍 등은 별도 경로로 처리한다.
7. API 계약은 `docs/api-contract_error-standard.md`, `docs/api-response-standard.md`를 따른다. 프론트 구조 변경만으로 백엔드 계약이 변경되는 것은 아니다.

## 2. 검토한 GitHub 브랜치 현황

다음은 **2026-11-05 조회 시점**의 프론트엔드 코드 기준이며, 브랜치 변경에 따라 달라질 수 있다.

| 브랜치 | 확인한 프론트엔드 구성 | 통합 시 주의점 |
|---|---|---|
| `develop` (`4e508bf`) | Bootstrap 기초 파일 및 설정 | 신규 통합 구조의 기준점 |
| `feature/member-front` (`3bc73fc`) | `page/` 인증 화면, `util/apiUtil.js`, `AuthContext.jsx` | 인증 로직과 `main.jsx` 병합 충돌 |
| `feature/Event-Service` (`3442f96`) | `pages/Event`, `pages/admin`, `pages/user`, `src/api.js` | 이벤트 화면과 API 유틸리티 이동 |
| `feature/service_dou` (`12c7497`) | Event 화면, 등록·승인 관련 화면, `api.js` | Event 작업 브랜치 간 최신 구현 확인 필요 |
| `feature/Interaction-Service` (`399d8a8`) | `App.jsx` 기반 투표 데모 | 데모 코드와 백엔드 연동 코드 분리 |

> **주의:** `feature/member-front`의 `apiUtil.js`는 재발급 실패 시 정의되지 않은 `result`를 반환하는 코드가 확인되었고, 로그인·재발급에서 `res.text()`로 토큰을 읽고 있다. 최신 공통 응답 계약이 실제 적용되면 `data.accessToken`으로 읽도록 고쳐야 한다. `feature/service_dou`의 `api.js`에는 임시 `X-Member-Id`/`X-User-Role` 전송 코드가 있어 실제 Gateway 인증 연동 시 제거해야 한다.

참고: [EMS 저장소](https://github.com/OZA-bot-droid/ems), [Member 프론트 API 유틸](https://github.com/OZA-bot-droid/ems/blob/feature/member-front/frontend/src/util/apiUtil.js), [공통 API 응답 표준](https://github.com/OZA-bot-droid/ems/blob/main/docs/api-response-standard.md)

## 3. 최종 목표 디렉터리 구조

아래는 **목표 설계**다. 모든 파일이 현재 존재한다는 뜻은 아니며, 사용하지 않는 컴포넌트는 미리 빈 파일로 만들 필요가 없다.

```text
frontend/
├── public/                           # 공개 정적 에셋
├── src/
│   ├── app/                           # 앱 설정 및 라우터
│   │   ├── App.jsx
│   │   ├── router.jsx
│   │   └── providers.jsx
│   ├── api/                           # 공통 HTTP/인증 통신 인프라
│   │   ├── axiosInstance.js
│   │   ├── tokenStore.js
│   │   └── apiError.js
│   ├── features/
│   │   ├── member/
│   │   │   ├── api/memberApi.js
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   ├── SignupPage.jsx
│   │   │   │   ├── OAuthCallbackPage.jsx
│   │   │   │   └── MyPage.jsx
│   │   │   ├── context/AuthContext.jsx
│   │   │   ├── hooks/useAuth.js
│   │   │   └── utils/getClientId.js
│   │   ├── event/
│   │   │   ├── api/
│   │   │   │   ├── eventApi.js
│   │   │   │   └── registrationApi.js
│   │   │   ├── components/
│   │   │   │   ├── EventFormModal.jsx
│   │   │   │   ├── SessionFormModal.jsx
│   │   │   │   └── RegistrationApplyModal.jsx
│   │   │   ├── pages/
│   │   │   │   ├── EventListPage.jsx
│   │   │   │   ├── EventDetailPage.jsx
│   │   │   │   ├── EventManagePage.jsx
│   │   │   │   ├── SessionManagePage.jsx
│   │   │   │   ├── RegistrationPage.jsx
│   │   │   │   └── AdminApprovalPage.jsx
│   │   │   ├── hooks/
│   │   │   └── styles/
│   │   └── interaction/
│   │       ├── api/pollApi.js
│   │       ├── components/
│   │       │   ├── PollCard.jsx
│   │       │   ├── VoteForm.jsx
│   │       │   └── PollResult.jsx
│   │       ├── pages/
│   │       │   ├── PollListPage.jsx
│   │       │   ├── VotePage.jsx
│   │       │   └── PollManagePage.jsx
│   │       ├── hooks/
│   │       └── websocket/stompClient.js
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   ├── MainLayout.jsx
│   │   │   └── AdminLayout.jsx
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── Loading.jsx
│   │   └── guards/ProtectedRoute.jsx
│   ├── hooks/                         # 여러 도메인에서 공용으로 사용하는 훅
│   ├── utils/                         # 날짜/문자열 등 순수 함수
│   ├── styles/
│   │   ├── global.scss
│   │   └── variables.scss
│   └── main.jsx
├── .env.example
├── .npmrc
├── .nvmrc
├── .prettierrc
├── Dockerfile
├── index.html
├── package.json
├── package-lock.json
└── vite.config.js
```

> **참고:** 기존 `style.css`를 즉시 삭제할 필요는 없다. Tailwind CSS 4 설정과 글로벌 스타일 import를 확인하고 단계적으로 `styles/`에 정리한다. `react-router-dom`, `axios`, STOMP 클라이언트 등은 실제 사용 시 `package.json`에 명시적으로 추가하고 lockfile도 함께 갱신한다.

## 4. 책임 경계 및 팀 협업 규칙

| 위치 | 책임 | 변경 시 원칙 |
|---|---|---|
| `app/` | Router, Provider, 앱 조립 | 전 팀 리뷰 권장 |
| `api/` | Axios 인스턴스, 공통 오류, 토큰 연계 | 인증 담당·팀장 리뷰 |
| `features/member/` | 로그인/가입/회원 정보 및 인증 UI | Member 담당 주도 |
| `features/event/` | 행사·세션·참가 신청·승인 | Event 담당 주도 |
| `features/interaction/` | Poll, 투표, 실시간 구독 | Interaction 담당 주도 |
| `components/` | 서비스에 종속되지 않은 레이아웃·UI | 공통 컴포넌트 API 합의 |
| `hooks/`·`utils/` | 여러 기능에 공통인 Hook 및 순수 유틸 | 중복 여부 확인 |
| `styles/` | 공통 스타일·디자인 변수 | 충돌 주의 |

- 전용 UI는 해당 기능의 `components/`에 둔다. 예: `EventFormModal`은 `features/event/components/`.
- `admin/`, `user/`를 최상위 서비스 폴더로 분리하지 않는다. 역할별 페이지가 많아지면 기능 내부 `pages/admin/`, `pages/user/`를 만든다.
- 역할별 프론트 라우트 가드는 UX 도구일 뿐이다. ADMIN 검증과 행사 소유권 검증은 Gateway/백엔드에서 반드시 수행한다.
- 기능 폴더 간 직접 깊은 import를 최소화한다. 반복 사용 코드는 사용 의도가 명확할 때 공통 계층으로 이동한다.
- `main.jsx`, `router.jsx`, `axiosInstance.js` 등 공통 변경은 개별 브랜치에서 동시에 덮어쓰지 않는다.

## 5. Axios 공통 API 계층 설계

### 5.1 도입 타당성

Fetch도 같은 기능을 구현할 수 있으므로 Axios는 필수 기술이 아니다. 다만 EMS처럼 여러 서비스에서 JWT 헤더 첨부, 401 재발급, 공통 오류 객체, 204 처리, timeout이 반복될 경우 Axios의 인터셉터가 구현과 유지보수에 유리하다.

- **REST 요청:** Axios 사용
- **서비스별 URL 구성:** `features/*/api/*.js`
- **WebSocket/STOMP:** 별도 클라이언트; Axios 미사용
- **OAuth2 브라우저 리다이렉트:** 별도 navigation 흐름
- **일반 파일·스트리밍:** 응답 타입에 맞는 별도 처리

### 5.2 기본 인스턴스 예시

```javascript
// src/api/axiosInstance.js — 기본 구성 예시(인터셉터는 별도 추가)
import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 10000,
});

// 토큰 재발급은 일반 401 응답 인터셉터의 재귀 호출을 피하도록 별도 인스턴스 사용
export const refreshApi = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 10000,
});
```

- `baseURL: '/api'`는 상대 경로를 사용하므로 로컬·배포 환경에 `localhost:8080`을 하드코딩하지 않는다.
- 로컬 Vite 프록시가 `/api`를 Gateway(8080)로 보내고, 배포용 Nginx도 같은 외부 경로를 Gateway에 프록시하도록 설정한다.
- `withCredentials`는 쿠키 전송 제어이며, CORS·SameSite·Secure 쿠키 정책은 배포 환경에 맞게 별도 검증한다.
- `refreshApi`를 분리하더라도 재발급 요청 자체의 실패에 또 재발급을 시도하는 로직을 넣어서는 안 된다.

### 5.3 기능별 API 예시

```javascript
// src/features/event/api/eventApi.js
import { api } from '../../../api/axiosInstance';

export const eventApi = {
  list: (params) =>
    api.get('/events', { params }).then((res) => res.data.data),
  detail: (eventId) =>
    api.get(`/events/${eventId}`).then((res) => res.data.data),
  create: (data) =>
    api.post('/events', data).then((res) => res.data.data),
  update: (eventId, data) =>
    api.patch(`/events/${eventId}`, data).then((res) => res.data.data),
  remove: async (eventId) => {
    await api.delete(`/events/${eventId}`); // 204: JSON 본문 없음
    return null;
  },
};
```

이 예시는 백엔드가 `docs/api-response-standard.md`의 성공 JSON 계약을 구현한 뒤 사용할 코드다. 개발 기간 중 서비스별 적용 상태가 다르면 임시 호환 처리와 제거 시점을 명시한다.

### 5.4 EMS API 규약 매핑

| 상황 | 공통 클라이언트 처리 |
|---|---|
| HTTP 200/201/202 | 성공 JSON `response.data.data` 사용 |
| HTTP 204 | JSON 파싱하지 않고 `null` 반환 |
| HTTP 400 | 검증 오류 `code` 및 메시지 표시 |
| HTTP 401 | 보호 API에서 조건을 충족할 때만 재발급 1회 시도 |
| HTTP 403 | 재발급하지 않고 권한 오류 표시 |
| HTTP 404 | 없는 리소스 처리 |
| HTTP 409 | 중복·상태 충돌 처리 |
| HTTP 5xx | 안전한 오류 안내, 무한 재시도 금지 |
| 네트워크 오류 | HTTP 응답 없음으로 구별 |

- 성공/실패 1차 판단은 **실제 HTTP 상태**를 기준으로 한다.
- 프론트 기능 분기는 오류 `message` 문자열이 아니라 안정적인 `code`로 구현한다.
- Axios 오류의 HTTP 본문은 일반적으로 `error.response?.data`로 확인한다.
- Gateway는 하위 서비스가 반환한 JSON을 다시 래핑하지 않는다.

## 6. JWT 및 Refresh Token 처리 정책

### 6.1 핵심 원칙

1. Access Token은 가능한 한 메모리 기반 상태에 보관하고 API 요청에 `Authorization: Bearer ...`로 전송한다.
2. Refresh Token은 응답 본문이나 JavaScript 접근 가능한 저장소에 넣지 않고 HttpOnly 쿠키를 사용한다.
3. 요청 인터셉터는 공개 API 및 인증 API 예외를 고려하여 필요한 경우에만 Access Token을 첨부한다.
4. 401 발생 시 **로그인 실패·재발급 실패·이미 재시도한 요청**은 자동 재발급에서 제외한다.
5. 동일 시점의 여러 401은 **단일 Promise(single-flight)**로 묶어 Refresh Rotation 경쟁을 방지한다.
6. 새 Access Token 발급 성공 후 대기 중인 요청을 최대 1회 재시도한다.
7. Refresh 실패 시 인증 상태를 정리한다. 로그아웃·만료·세션 무효화 동작은 서버 계약과 일치시킨다.
8. 403은 토큰 재발급 대상이 아니다.
9. `clientId`는 Refresh 세션 연계 식별자이며 보안 인증을 대신하지 않는다.

### 6.2 개념 흐름

```text
보호 API 요청 → Access Token 첨부 → Gateway
                                   │
                                   ├─ 2xx → 성공 데이터 반환
                                   └─ 401 → 재발급 대상인지 판단
                                               │
                                               ├─ 아니오 → 오류 반환
                                               └─ 예 → 공유 중인 Refresh Promise?
                                                          │
                                                          ├─ 있음 → 해당 Promise 대기
                                                          └─ 없음 → POST /api/members/reissue 1회
                                                                    │
                                                                    ├─ 성공 → 새 Access Token → 원래 요청 1회 재시도
                                                                    └─ 실패 → 인증 상태 정리, 오류 반환
```

`AuthContext` 내부의 Refresh Promise와 Axios 인터셉터 간 책임이 중복되지 않도록 한다. 인터셉터를 React 렌더링마다 등록하지 않고, 안정적인 토큰 접근 API 및 해제/등록 정책을 갖춘다.

## 7. React Router 및 Provider

- `main.jsx`: `createRoot` 및 전체 Provider/앱 진입점
- `app/providers.jsx`: BrowserRouter 또는 RouterProvider, AuthProvider 등 전역 Provider 조합
- `app/router.jsx`: 모든 서비스 기능 화면 경로를 등록
- `components/guards/ProtectedRoute.jsx`: 프론트 수준 로그인/권한 UX 처리

**예시 경로 초안:**

| 경로 | 화면 | 접근 정책 |
|---|---|---|
| `/login` | 로그인 | 공개 |
| `/signup` | 회원가입 | 공개 |
| `/oauth-success` | OAuth 콜백 | 별도 인증 흐름 |
| `/events` | 행사 목록 | 공개 |
| `/events/:eventId` | 행사 상세 | 공개(비공개 데이터는 서버 확인) |
| `/registrations` | 나의 신청 내역 | 인증 필요 |
| `/polls` | 투표 목록 | 인증/참가 권한은 백엔드 기준 |
| `/admin/events` | 행사 관리 | ADMIN + 서버 소유권 검증 |
| `/admin/sessions` | 세션 관리 | ADMIN + 서버 소유권 검증 |
| `/admin/approvals` | 신청 승인 | ADMIN + 서버 소유권 검증 |
| `/bootstrap` | 개발용 연결 점검 | 운영 노출 여부 별도 결정 |

`react-router-dom` 설치 버전과 사용 API는 통합 시 팀에서 고정한다. 기존 Member 브랜치의 React Router와 Event 브랜치의 `window.location.pathname` 분기를 혼용하지 않는다.

## 8. 기존 파일 이동 맵

| 기존 위치(작업 브랜치) | 권장 목표 위치 | 비고 |
|---|---|---|
| `src/page/Login.jsx` | `src/features/member/pages/LoginPage.jsx` | 로그인 응답 JSON 파싱 수정 |
| `src/page/Signup.jsx` | `src/features/member/pages/SignupPage.jsx` | API 공통화 |
| `src/page/AuthContext.jsx` | `src/features/member/context/AuthContext.jsx` | 토큰 관리 책임 정리 |
| `src/page/AuthLogin.jsx` | `src/features/member/pages/OAuthCallbackPage.jsx` | OAuth 처리 검증 |
| `src/page/LoginSuccess.jsx` | Member 하위 적합한 화면 | 기존 테스트 페이지인지 검토 후 명명 |
| `src/util/getClientId.js` | `src/features/member/utils/getClientId.js` | 고유 식별자 처리 유지 |
| `src/util/apiUtil.js` | `src/api/axiosInstance.js` 등 | 코드 복사보다 인증/재발급 로직 재구성 |
| `src/api.js` | `src/features/event/api/eventApi.js`, `registrationApi.js` | 임시 인증 헤더 제거 |
| `src/pages/Event/*` | `src/features/event/pages/`, `components/`, `styles/` | 파일 성격에 맞게 이동 |
| `src/pages/admin/AdminApprovalPage.jsx` | `src/features/event/pages/AdminApprovalPage.jsx` | Event 소유 기능 |
| `src/pages/user/RegistrationPage.jsx` | `src/features/event/pages/RegistrationPage.jsx` | Event 소유 기능 |
| `src/component/Header.jsx` | `src/components/layout/Header.jsx` | 공통 Header |
| Interaction의 `src/App.jsx` | `src/features/interaction/` 아래 개별 컴포넌트/페이지 | 데모 데이터와 실제 API 연동 분리 |
| 각 브랜치 `src/main.jsx` | 하나의 통합 `src/main.jsx` | 단순 덮어쓰기 금지 |

파일 이동 시 import 경로·CSS import·라우트 경로·테스트 경로를 함께 수정한다. `git mv`로 히스토리를 최대한 추적 가능하게 유지하되, 기능별 충돌이 큰 파일은 수동 통합한다.

## 9. 단계별 이전·병합 실행 계획

### 1단계 — 공통 골격 확정

- `develop` 최신 HEAD를 기준으로 별도의 통합 작업 브랜치에서 시작한다.
- `app/`, `api/`, `features/`, `components/`, `utils/`, `styles/` 책임을 합의한다.
- `main.jsx`, 라우터, 공통 API 파일의 수정 담당자를 정한다.

### 2단계 — 공통 API 및 Router 도입

- Axios 및 라우터 의존성을 추가하고 lockfile 반영.
- Vite `/api` 프록시 확인.
- 성공/오류 응답 형식, 204, 쿠키, 인증 헤더 처리 정책 구현.
- 라우트별 공개/인증/ADMIN 접근 구분.

### 3단계 — Member 이전

- 로그인, 회원가입, OAuth, 회원정보 화면 이전.
- `res.text()` 기반 Access Token 파싱을 `data.accessToken` 기반으로 수정.
- 401 single-flight 및 Refresh Rotation 재사용 탐지 시나리오 테스트.

### 4단계 — Event 이전

- 최신 Event 담당 브랜치의 UI/기능을 선택해 이동.
- 행사/세션/신청 API를 기능별 모듈로 분리.
- 임시 `DEV_USERS` 및 직접 신뢰 헤더 전송 코드 제거.

### 5단계 — Interaction 이전

- 단일 데모 `App.jsx`를 페이지·컴포넌트로 분할.
- 실제 Poll REST API와 서버의 권한/오류 계약 연계.
- STOMP 구독, 연결 끊김, 재연결, 구독 권한을 별도 검증.

### 6단계 — 통합 검증 후 병합

- 로컬 환경에서 Build, React Router, Gateway 프록시, 네트워크 호출 검증.
- Member → Event → Interaction 순서로 기능별 회귀 테스트.
- API 계약 테스트 통과 후 `develop` 병합, 최종적으로 `main` 병합 정책에 따름.

## 10. 코드 작성·리뷰 규칙

- 페이지/컴포넌트: `PascalCase.jsx` (예: `EventListPage.jsx`)
- Hook: `use*.js`/`use*.jsx` (예: `useAuth.js`)
- API/유틸: `camelCase.js` (예: `eventApi.js`)
- 모든 일반 REST API 요청은 공통 Axios 인스턴스를 통과하게 한다.
- API 도메인별 모듈만 Gateway 상대 URL을 조합하고, 컴포넌트에 `localhost:8080`을 하드코딩하지 않는다.
- 공통 오류 코드 분기는 `code` 기준으로 하고, 메시지는 사용자 안내에 사용한다.
- 인가 및 리소스 소유권 검증을 프론트만으로 구현하지 않는다.
- 시크릿, RSA 개인키, Refresh Token 원문을 프론트 저장소에 두지 않는다.
- 공통 파일 변경 시 팀원 리뷰 후 병합한다.
- 린트/포매터/빌드 확인, 변경 화면 수동 테스트 및 API 계약 테스트를 PR 체크리스트로 운영한다.

## 11. 통합 테스트 체크리스트

- [ ] `npm install`/`npm ci` 후 `npm run build` 성공
- [ ] `/api` 요청이 Vite 개발 프록시 및 운영 Nginx를 통해 Gateway로 전달
- [ ] 로그인 200 응답의 `data.accessToken`을 파싱
- [ ] 로그인 실패 401에서 불필요한 Refresh 요청 없음
- [ ] Access Token 만료 시 Refresh 요청 1회 및 원래 요청 1회 재시도
- [ ] 세 요청 동시 401에서도 Refresh 요청이 한 번만 실행
- [ ] Refresh 실패·재사용 탐지 후 세션 상태 정리
- [ ] 403 권한 오류에서 Refresh 요청이 발생하지 않음
- [ ] 204 응답을 JSON으로 파싱하지 않음
- [ ] 공통 오류 `code`/HTTP 상태가 일치하고 화면에 안전한 메시지가 노출됨
- [ ] `path` 응답에 `/api/api` 중복이 없음
- [ ] Event 임시 `X-Member-Id`/`X-User-Role` 직접 전송 제거
- [ ] 로그인/행사/신청/투표 모든 화면이 단일 라우터에 정상 등록
- [ ] ADMIN 경로의 프론트 가드 및 백엔드 인가 별도 검증
- [ ] 실시간 투표 WebSocket은 Axios와 독립적으로 연결/재연결 검증
- [ ] 기존 브랜치의 `main.jsx` 덮어쓰기·import 누락 없음

## 12. 결정사항 및 미확정 사항

### 이번 설계에서 권장하는 결정

- 단일 SPA 유지
- Feature-Based 폴더 구조
- 공통 Axios 클라이언트 도입
- 서비스별 `api/` 모듈
- 전역 React Router
- 명시적인 성공·오류 응답 계약 준수

### 팀 합의 및 검증이 추가로 필요한 내용

- React Router 버전과 기존 의존성 호환성
- Axios 인터셉터 및 AuthContext 사이 토큰 갱신 책임
- 401 자동 갱신 적용 대상·로그아웃/Refresh 쿠키 정책
- Event/Interaction 최신 코드 브랜치 선정과 UI 충돌 해결
- WebSocket 서버 인증 및 STOMP 구독 권한 정책
- 운영 Nginx 프록시, 쿠키 SameSite/Secure, CORS 설정
- 공통 UI 디자인 토큰과 SCSS/Tailwind 적용 우선순위

---

**문서 적용 원칙:** 이 파일은 GitHub 반영 전 팀 검토용 표준안이다. 실제 코드를 이동하거나 Axios를 설치하거나 브랜치를 병합하지 않았으며, 모든 목표 파일이 구현 완료라는 의미가 아니다.
