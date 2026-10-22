# EMS UI 디자인 토큰 및 5인 협업 규칙

Figma: https://www.figma.com/design/pGmsSKSinvxygwdRpKRBk3

## 토큰 소유권

- **단일 런타임 원천:** `frontend/src/styles/tokens.css`의 `--ems-*` CSS custom properties.
- **Tailwind CSS 4:** 동일 파일의 `@theme inline` 매핑을 통해 `bg-ems-primary`, `text-ems-text`, `border-ems-border`, `font-ems` 등 사용.
- **SCSS Modules:** `frontend/src/styles/_tokens.scss`에서 CSS custom properties를 참조하는 Sass 별칭만 제공. 수치 또는 색상 값을 중복 하드코딩하지 않는다.
- **공통 스타일 진입점:** `frontend/src/style.css`에서 Tailwind 및 토큰을 한 번만 불러온다.

## 담당자 간 충돌 방지

1. 각 컴포넌트는 `ComponentName.module.scss`로 스타일 범위를 제한한다.
2. 전역 선택자(`body`, `h1`, `button` 등)는 `style.css` 외의 모듈에서 금지한다. `:global` 사용은 팀 합의를 거친다.
3. 토큰 추가 또는 변경은 별도 PR과 최소 한 명의 리뷰를 거친다. 색상/간격을 페이지별로 임의 재정의하지 않는다.
4. Tailwind는 레이아웃·반응형·상태 유틸리티, SCSS Modules는 컴포넌트별 복합 스타일에 사용한다.
5. 컴포넌트가 같은 목적의 스타일을 Tailwind와 SCSS 양쪽에서 동시에 지정하지 않는다.
6. 모든 개발자는 `frontend`를 VS Code 작업 루트로 사용하고 `npm install` 후 `npm run build`를 확인한다.

## 예시

```jsx
import styles from './MetricCard.module.scss';

export function MetricCard({ title, value }) {
  return (
    <article className={`${styles.card} p-5`}>
      <h3 className={styles.title}>{title}</h3>
      <strong className={styles.value}>{value}</strong>
    </article>
  );
}
```

## 디자인 기준

색: 기본 녹색 `#169B62`, 짙은 사이드바 `#17253C`, 배경 `#F7F9FC`, 본문 `#142238`, 경계 `#E7ECF2`.
간격: 4px 기반, 4/8/12/16/20/24/32px. 카드 모서리 16px. 기본 글꼴은 Pretendard 우선(미설치 시 폴백). 디자인 내 예시 수치는 실제 API 데이터가 아님.

## 설치·테스트

```powershell
cd frontend
npm install
npm run build
npm run format:check
```

`sass`가 devDependency로 필요하다. 토큰 추가는 `tokens.css`와 `_tokens.scss`의 참조 별칭을 함께 검토한다.
