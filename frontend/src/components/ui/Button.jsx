import styles from '../../styles/scaffold.module.scss';

/**
 * EMS 공통 버튼
 *
 * P0 수정 내용
 * 1. CSS Modules에 정의된 button 클래스를 직접 연결한다.
 * 2. 기존 children 및 나머지 props 전달 방식을 유지한다.
 * 3. 외부 className도 함께 적용할 수 있도록 지원한다.
 *
 * 주의:
 * 기존 동작 호환을 위해 type 기본값은 변경하지 않는다.
 */
export default function Button({ children, className = '', ...props }) {
  // CSS Modules 클래스 + 호출부의 추가 클래스
  const buttonClassName = [styles.button, className].filter(Boolean).join(' ');

  return (
    <button {...props} className={buttonClassName}>
      {children}
    </button>
  );
}
