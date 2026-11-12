/**
 * Member 전용 공통 폼 스타일
 *
 * P2 잔여 수정:
 * - 공통 입력 스타일에서 w-full 제거
 * - 필드 너비는 각 호출부에서 결정
 * - 기존 높이·반경·색상·focus 유지
 *
 * LoginPage는 별도 입력 스타일을 사용한다.
 */

// 회원가입 공통 입력 필드
export const signupInput =
  'h-[44px] rounded-[10px] ' +
  'border border-ems-member-input-border ' +
  'bg-white px-4 text-[13px] text-ems-text ' +
  'outline-none transition ' +
  'placeholder:text-ems-member-placeholder ' +
  'focus:border-ems-primary ' +
  'focus:ring-2 focus:ring-ems-primary/15';

// 회원가입 주요 버튼
// 기존 스타일 유지
export const primaryButton =
  'rounded-[10px] bg-ems-primary px-4 ' +
  'text-[13px] font-semibold text-white ' +
  'transition-colors hover:bg-ems-member-primary-hover ' +
  'disabled:opacity-50';

// 회원가입 보조 버튼
// 기존 스타일 유지
export const outlineButton =
  'rounded-[10px] border border-ems-primary ' +
  'px-4 text-[12px] font-semibold text-ems-primary ' +
  'hover:bg-ems-member-primary-soft ' +
  'disabled:opacity-50';
