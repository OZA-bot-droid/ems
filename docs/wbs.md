# EMS 프로젝트 WBS 및 5인 역할 분담 (2026-10-19 ~ 2026-11-16)

> 최종 목표: 6개 MSA 서비스. **P0 구현 우선순위는 Member / Event / Interaction 3개 서비스**이며, Notification / Analytics / Integration 분리는 P0 안정화 후 검토한다. DB는 PostgreSQL 16.

## 담당자 및 역할

| 구분 | 담당자 | 역량 | 책임 영역 | 주요 산출물 |
|---|---|---|---|---|
| 팀장 | **오좌언** | 총괄·통합 | 공통 아키텍처, Spring Cloud Gateway, Nginx, Docker Compose, PostgreSQL 개발환경, Git/PR, CI/CD 및 전체 연동 | 통합 실행환경·라우팅·통합 테스트·배포 |
| A | **하진철** | 상급 | Member Service + 로그인/인증 UI | 회원가입·로그인·JWT·권한 관리 |
| B | **박천보** | 상급 | Interaction Service + 실시간 투표 UI/차트 | WebSocket/STOMP·투표·실시간 결과 |
| C | **이도형** | 중급 | Event Service의 참가 신청·승인 + 사용자 UI | 참가 상태·정원·중복 신청 관리 |
| D | **이도관** | 초급 | Event Service의 행사·세션 CRUD + 관리자 UI | 행사·세션 등록/조회/수정 |

## 담당자별 구체적인 구현 범위

### 오좌언 — 팀장 / 공통 아키텍처·인프라·통합
- **P0 직접 구현:** Spring Cloud Gateway 라우팅 및 StripPrefix 정책, CORS, WebSocket 프록시 경로; Nginx를 통한 React SPA 및 API Reverse Proxy; PostgreSQL 16 개발환경과 서비스별 DB/계정 초기화; Docker Compose 통합 실행; 환경변수/Secret 관리 기준; Git 브랜치·PR 규칙 및 API/오류 응답 규격 조율.
- **P0 통합 책임:** 서비스별 API 라우팅, JWT 전달·검증 경계(A와 협의), WS 연결(B와 협의), 서비스 간 통신, 로그·빌드·배포 오류 분석, 전체 기능 시나리오 통합 테스트.
- **P1 여유 시:** GitHub Actions 빌드·테스트, Prometheus/Grafana, Kubernetes/OpenShift 시범 배포.
- **경계:** Member JWT 발급 및 Interaction 투표 비즈니스 로직은 각 담당자가 구현; 팀장은 연결·보안 경계·통합을 검증.

### 하진철 — A / Member Service·인증 UI
- **백엔드:** 회원가입·로그인·본인정보 조회, BCrypt 비밀번호 해싱, Spring Security, JWT 발급/서명·만료 검증, USER/ADMIN RBAC, 인증 실패(401)·권한 부족(403) 구분.
- **프론트:** 로그인/회원가입 화면, 토큰 취급 및 보호 화면 연결, 로그인 실패 메시지.
- **협업:** 팀장과 Gateway JWT/CORS 계약 조기 확정; 박천보·이도형·이도관에게 인증 인터페이스 및 테스트 계정 제공.
- **완료 기준:** 로그인 → JWT 발급 → 보호 API 인증/인가 검증 성공; 비인가 접근 차단.

### 박천보 — B / Interaction Service·실시간 투표 UI
- **백엔드:** WebSocket/STOMP 연결·구독·방 관리, 투표 생성·참여·결과 집계 및 실시간 브로드캐스트, 사용자별 중복 투표 차단(DB 고유 제약), 연결 종료·재접속 기초 처리.
- **프론트:** 실시간 투표 참여 화면·결과 차트, 연결 및 응답 상태 처리.
- **협업:** 하진철과 WebSocket 인증, 이도형의 참가 승인 API 확인, 팀장과 Nginx/Gateway WSS 라우팅 검증.
- **완료 기준:** 승인된 회원이 투표하고 다중 브라우저에서 실시간 결과가 반영되며 중복 투표가 차단됨.
- **우선순위:** 실시간 투표 P0, 실시간 토론/채팅은 P1.

### 이도형 — C / Event Service 참가·승인·사용자 UI
- **백엔드:** 참가 신청/취소/승인/거절, PENDING·APPROVED·REJECTED·CANCELLED 상태 전이, 중복 신청 방지, 행사 정원 초과 방지(트랜잭션·동시성 검증), 신청자 본인 접근 제어.
- **프론트:** 참가 신청 화면, 나의 신청 내역, 승인 상태 안내 및 관리자의 신청 승인 UI.
- **협업:** 이도관과 Event Service 엔티티·DB 마이그레이션·패키지 경계 합의; 박천보에게 참가 승인 검증 API 제공; 이도관의 DB 설계와 PR 리뷰 지원.
- **완료 기준:** 한 행사에 중복 신청 불가, 허가된 관리자만 승인 가능, 정원 초과 및 타인 신청 변경 차단.

### 이도관 — D / Event Service 행사·세션 CRUD·관리 UI
- **백엔드:** 행사 목록·상세·생성·수정, 세션 생성·조회 및 행사-세션 관계, 기본 입력값·일정 검증. 삭제/복잡한 예외는 안정화 후 추가.
- **프론트:** 행사 목록·상세·관리자 등록/수정 화면, 세션 관리 기본 UI.
- **협업:** 이도형의 Event Service 구조·데이터 모델/PR 리뷰 지원을 받아 작업; 공통 엔티티·마이그레이션 변경 시 이도형과 사전 합의.
- **구현 순서:** 조회 → 생성 → 수정 → 세션 조회/생성 → 예외 처리/삭제.
- **완료 기준:** 관리자의 행사 등록·조회·수정과 행사별 세션 조회·등록 동작.

## Event Service 공동 작업 경계 (이도형·이도관)

```text
event-service/src/main/java/com/ems/event/
├── event/          # 이도관: 행사 도메인/CRUD
├── session/        # 이도관: 세션 도메인/CRUD
├── registration/   # 이도형: 참가 신청/승인
└── common/         # 공통 예외/설정: 양측 합의 후 변경
```

- `events`, `sessions` 구조와 FK 변경은 양측 PR 리뷰를 거친다.
- 참가 승인 정원 체크는 Event Service 내에서 처리하며 외부 DB 직접 접근은 금지한다.
- DB 변경은 서비스별 버전 관리(Flyway 권장)로 충돌 방지한다.
- 박천보의 Interaction Service는 Event API를 통해 참가 승인 여부를 확인한다.

## 주차별 WBS

| 기간 | 오좌언 (팀장) | 하진철 (A) | 박천보 (B) | 이도형 (C) | 이도관 (D) | 주요 제출물 |
|---|---|---|---|---|---|---|
| **10/19–10/23** | Gateway/Nginx/Compose/PostgreSQL 실행 확인, API 규칙 | JWT 계약·가입/로그인 골격 | WebSocket 연결 PoC | 신청 상태·DB/API 설계 | 행사 조회/생성 기초 | **10/23 기획보고서** |
| **10/26–10/30** | API·인증 라우팅 및 CORS 통합 | JWT/Security·로그인 UI | 투표 API/참여 UI | 참가 신청·승인 구현 | 행사/세션 CRUD·관리 UI | **10/28 UI 최종 설계** |
| **11/02–11/06** | Nginx/Gateway/프론트·백 통합, 장애 분석 | 권한·401/403 테스트 | 실시간 결과/차트 및 참가자 검증 | 중복·정원 동시성 테스트 | CRUD 안정화 및 화면 연동 | **11/03 DB, 11/04 앱 구조 설계** |
| **11/09–11/13** | 기능 동결·배포·통합/보안 테스트 | 인증 회귀·보안 오류 수정 | WS 통합/재접속 오류 수정 | 신청/승인 E2E 및 오류 수정 | UI/CRUD 버그 수정 | **11/13 통합 테스트·배포** |
| **11/16** | 전체 아키텍처·기술적 해결 발표 | 인증 파트 설명 | 실시간 기능 시연 | 참가 관리 시연 | 행사·세션 시연 | **최종 발표·제출** |

## 주요 내부 완료 게이트

- **10/23:** 서비스 API 계약, DB 소유권, JWT 형식과 WS 인증 방식 합의.
- **10/30:** 핵심 REST API(회원·행사·참가) 동작.
- **11/04:** React ↔ Gateway ↔ 서비스 통신·CORS 확인.
- **11/06:** WebSocket 투표 및 필수 사용자 흐름 통합.
- **11/09:** 신규 P1 기능 추가 중단, 기능 동결.
- **11/11:** JWT/RBAC·중복 투표·정원·WSS·배포 테스트.
- **11/13:** Docker 배포 및 시연 환경 확정.

## 우선순위 및 협업 운영
- **P0:** Member, Event, Interaction, React 주요 화면, Gateway/Nginx, PostgreSQL, Docker, OpenAPI, 핵심 통합 테스트.
- **P1:** Notification, Analytics, Integration 서비스의 독립 구현, 채팅, 고급 모니터링, CI/CD·Kubernetes/OpenShift는 P0 안정화 및 교육 평가 기준 확인 후 조정.
- 모든 구현 PR은 최소 1명 이상의 다른 팀원 리뷰를 받고, 기능 구현 담당자가 API 문서 및 테스트 결과를 함께 제출한다.
- 진행 점검: 최소 2~3일 간격으로 공통 개발환경에서 실제 통합 테스트.
