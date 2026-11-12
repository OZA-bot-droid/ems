/**
 * Member 전용 공통 폼 스타일
 *
 * P2 목적:
 * - 회원가입 필드 및 버튼 스타일 중복 제거
 * - CSS 디자인 토큰 사용
 * - 기존 화면 크기와 반응형 유지
 *
 * 주의:
 * LoginPage는 높이 42px 및 border-0을 사용한다.
 * 따라서 회원가입과 로그인 입력 필드를
 * 무조건 같은 클래스로 통합하지 않는다.
 */

// 회원가입 공통 입력 필드
export const signupInput =
  'h-[44px] w-full rounded-[10px] ' +
  'border border-ems-member-input-border ' +
  'bg-white px-4 text-[13px] text-ems-text ' +
  'outline-none transition ' +
  'placeholder:text-ems-member-placeholder ' +
  'focus:border-ems-primary ' +
  'focus:ring-2 focus:ring-ems-primary/15';

// 회원가입 주요 버튼
export const primaryButton =
  'rounded-[10px] bg-ems-primary px-4 ' +
  'text-[13px] font-semibold text-white ' +
  'transition-colors hover:bg-ems-member-primary-hover ' +
  'disabled:opacity-50';

// 회원가입 보조 버튼
export const outlineButton =
  'rounded-[10px] border border-ems-primary ' +
  'px-4 text-[12px] font-semibold text-ems-primary ' +
  'hover:bg-ems-member-primary-soft ' +
  'disabled:opacity-50';
