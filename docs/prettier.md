# Prettier (EMS frontend)

프론트엔드 파일(`frontend/`)에는 Prettier 3.6.2를 적용합니다. 백엔드 Java 파일은 이 설정의 포맷팅 대상이 아니며 IntelliJ의 별도 Java 코드 스타일을 사용합니다.

## 최초 준비
- Node.js 22 / npm 10 준비
- VS Code 확장 **Prettier - Code formatter** 설치 권장
- `cd frontend && npm install`
- 팀장 1명이 생성한 `package-lock.json`을 PR로 공유한 뒤에는 `npm ci` 권장

## 실행
```powershell
cd frontend
npm run format:check
npm run format
npm run format:check
```

`format`은 실제 파일을 변경합니다. 변경 내용을 SourceTree에서 검토하고 필요한 파일만 커밋하세요. `format:check`는 수정 없이 검사합니다.

설정: 세미콜론 사용, JavaScript 작은따옴표, JSX 큰따옴표, 들여쓰기 2칸, 줄 길이 100, trailing comma all, LF 줄바꿈.

## VS Code
`frontend/.vscode/settings.json`은 프론트엔드 폴더를 VS Code 프로젝트로 열었을 때 적용됩니다. 저장 시 자동 포맷을 사용하려면 해당 확장이 설치되어 있어야 합니다.

**주의:** 이 PR에서는 의존성 패키지를 다운로드하거나 `package-lock.json`을 생성하지 않았습니다. 기존 전체 코드의 일괄 포맷 또한 수행하지 않았습니다.
