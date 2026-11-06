# EMS USER 08 — Live Voting (frontend)

## 개발 기준
- React 19.1.0 / Vite 6.3.4 / Tailwind CSS 4.1.5 / Node 22 / npm 10
- 공통 디자인 토큰: `src/styles/tokens.css` (`--ems-*` 단일 원천 및 Tailwind `@theme inline`)
- SCSS alias: `src/styles/_tokens.scss`
- 컴포넌트 스타일: `src/App.module.scss`
- 전역 진입점: `src/style.css`
- Sass 설치 필요: `npm install -D sass` (잠금 파일 동기화 필요)

## 실행
```sh
cd frontend
npm install
npm run dev
npm run build
```

## 기능 범위
현재 투표는 브라우저 `localStorage`를 사용하는 **데모**입니다. 시드 표수는 예시 수치이며, 다른 사용자의 실제 투표를 표시하지 않습니다. 서버 인증·승인 검사·중복 투표 제약·WebSocket 재연결은 미구현입니다.

백엔드 연동 시 계약 초안:
- `POST /api/interactions/polls/{pollId}/votes`
- `GET /api/interactions/polls/{pollId}/results`
- `/ws/interactions` 및 `/topic/sessions/{sessionId}/polls/{pollId}`

토큰 변경은 팀 규칙에 따라 리뷰 1명 이상을 거쳐 병합하세요.
