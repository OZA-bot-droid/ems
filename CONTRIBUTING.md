# 5인 팀 협업 규칙

## 브랜치
- `main`: 발표 가능한 안정 버전; 직접 push 대신 PR.
- `develop`: 선택적 통합 브랜치(팀 합의 시 개설).
- `feature/<issue>-<short-name>`, `fix/<issue>-<short-name>`, `docs/<topic>`.
- SourceTree에서도 fetch → 현재 브랜치 확인 → 최신화 → 작업 → 커밋 → push → PR 순서.

## PR 필수
- 최소 1명 리뷰, 자기 승인 금지, 기존 파일 충돌 처리 후 머지.
- 제목: `feat(auth): add login endpoint` 등 Conventional Commits.
- 설명: 작업 목적/변경 파일/테스트 결과/스크린샷(화면 변경)/영향 API.
- 환경변수 및 credential 절대 업로드 금지. `.env.example`만 커밋.

## 코드 및 API 규칙
- Frontend: React + Vite, TypeScript 사용 여부 첫날 확정, ESLint/Prettier 팀 공통 설정.
- Backend: Spring Boot, Java 버전 첫날 고정. 서비스별 controller/service/repository 구분.
- OpenAPI 명세에 상태 코드·요청/응답을 명시; DTO/DB Entity 직접 노출 금지.
- HTTPS 종단, CORS 허용 Origin, JWT 검증·RBAC·자원 소유권 테스트.
- 각 PR은 로컬 빌드와 테스트 결과를 포함하고 통합 브랜치를 먼저 확인.

## Definition of Done
요구사항 만족 + 테스트 통과 + API 문서 갱신 + 보안 검증 + 리뷰 완료 + 통합 환경 동작.
