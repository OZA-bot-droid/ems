/**
 * Interaction UI Style Tokens
 *
 * P2 목적:
 * - 투표 관리·참여 화면 스타일 중복 제거
 * - 기존 Tailwind 크기 및 색상 유지
 * - 디자인 토큰 기반 클래스 사용
 *
 * 주의:
 * 기존 emerald-700을 EMS 브랜드 색상으로
 * 변경하지 않고 별도 토큰으로 관리한다.
 */

// 공통 카드
// 기존 rounded-xl, p-5, shadow-sm 유지
export const interactionPanel =
  'rounded-xl ' + 'border border-ems-interaction-border ' + 'bg-white p-5 shadow-sm';

// 공통 입력 필드
// 기존 slate-300 테두리 색상 유지
export const interactionField =
  'w-full rounded-lg ' +
  'border border-ems-interaction-input-border ' +
  'bg-white px-3 py-2 text-sm';

// 기본 버튼 색상
export const interactionButtonBase =
  'rounded-lg ' + 'bg-ems-interaction-primary ' + 'px-4 py-2 text-white';

// 관리 화면 주요 버튼
export const interactionManageButton =
  `${interactionButtonBase} ` + 'text-sm font-semibold disabled:opacity-50';

// 투표 제출 버튼
// 기존 Vote 화면의 opacity-40 유지
export const interactionVoteButton = `${interactionButtonBase} ` + 'disabled:opacity-40';

// 종료·위험 버튼
export const interactionDangerButton =
  'rounded-lg ' +
  'bg-ems-interaction-danger ' +
  'px-4 py-2 text-sm font-semibold text-white ' +
  'hover:bg-ems-interaction-danger-hover ' +
  'disabled:opacity-50';
