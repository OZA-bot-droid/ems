# EMS — Cloud Native 통합 이벤트 관리 플랫폼

React 19 + Vite 6 + Tailwind CSS 4 · Spring Boot 3.4.5 (Java 21) · Spring Cloud Gateway 2024.0.1 · PostgreSQL 16 · Nginx.

**Bootstrap 단계:** Member / Event / Interaction 3개 서비스 및 Gateway, React, PostgreSQL, Nginx의 기본 실행 골격. 아직 기능 구현 완료가 아닙니다.

## 빠른 시작
```bash
cp .env.example .env
# .env 로컬 비밀번호 수정
docker compose up --build -d
```
http://localhost:8088 에서 3개 서비스 상태를 확인합니다. 자세한 검증: [docs/bootstrap.md](docs/bootstrap.md).

## 설계
- [목표 6개 서비스 아키텍처](docs/architecture.md)
- [기능 P0/P1/P2](docs/scope.md)
- [일정/WBS](docs/wbs.md)
- [API 계약](docs/api-contract.md)
- [데이터 모델](docs/data-model.md)
- [팀 규칙](CONTRIBUTING.md)

## 디렉터리
`frontend/`: React/Vite/Tailwind
`gateway/`: Spring Cloud Gateway
`member-service/`, `event-service/`, `interaction-service/`: Spring Boot
`infra/`: Nginx/PostgreSQL 인프라
`compose.yml`: 로컬 개발 통합 실행

후속: JWT + Spring Security, CRUD, WebSocket, 마이그레이션, 자동화 테스트, P1 3개 서비스, 모니터링/Cloud 배포.

