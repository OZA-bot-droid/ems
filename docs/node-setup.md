# EMS Node.js 개발 환경 통일

- Node.js: **22.x LTS** (frontend/.nvmrc), npm: **10.x** (`packageManager` 10.9.2)
- Frontend stack: React 19.1.0, Vite 6.3.4, Tailwind CSS 4.1.5
- Java 21, Spring Boot 3.4.5, PostgreSQL 16 설정은 변경하지 않음.

## 팀원 환경 점검
```bash
node -v
npm -v
cd frontend
npm install
npm run dev
npm run build
```

- Windows에서는 nvm-windows 등으로 Node 22 설치 후 IDE/터미널을 재시작하고 버전을 확인.
- `frontend/.npmrc`의 engine-strict로 다른 메이저 버전을 사용할 경우 설치를 실패 처리.
- **중요:** 패키지 레지스트리 네트워크 제한 때문에 자동 생성한 `package-lock.json`은 아직 저장소에 없음. 처음 인터넷 가능한 환경에서 팀장 한 명이 `npm install --package-lock-only`로 생성하고 PR에 커밋한다.
- 잠금 파일 병합 후 각 팀원은 `npm ci`로 설치한다. 그때 Dockerfile도 `npm install`에서 `npm ci`로 전환한다.
- 동일한 npm 메이저 범위여도 npm 마이너/패치 차이는 남을 수 있으므로 가능하면 npm 10.9.2 사용을 권장한다.
- Docker 빌드 이미지는 `node:22-alpine`으로 메이저 버전을 맞췄지만 정확한 Node 22.x 패치는 이미지 다운로드 시점마다 달라질 수 있다. 재현성이 필요하면 테스트한 이미지 digest 고정.
