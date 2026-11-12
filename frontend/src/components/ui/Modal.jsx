import styles from '../../styles/scaffold.module.scss';

/**
 * EMS 공통 모달
 *
 * P0 수정 내용
 * 1. backdrop 및 panel에 CSS Modules 클래스를 적용한다.
 * 2. 기존 props(open, title, children, onClose)를 유지한다.
 * 3. 모달 배경 클릭 시 닫기 동작을 유지한다.
 * 4. 모달 내부 클릭 시 이벤트 전파를 차단한다.
 * 5. 기존 접근성 속성을 유지한다.
 */
export default function Modal({ open, title, children, onClose }) {
  // 기존 조건부 렌더링 동작 유지
  if (!open) return null;

  return (
    <div className={styles['modal-backdrop']} role="presentation" onClick={onClose}>
      <section
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        // 모달 내부 클릭이 배경으로 전달되지 않도록 처리
        onClick={(event) => event.stopPropagation()}
      >
        <button onClick={onClose} aria-label="닫기">
          ×
        </button>

        <h2>{title}</h2>

        {children}
      </section>
    </div>
  );
}
