// 파일 기능: 모달의 키보드 이동과 포커스 복원을 관리합니다.

import { useEffect, useRef } from 'react';

// ESC 닫기, Tab 포커스 순환, 닫힐 때 이전 포커스 복원
export function useCreatePollDialog(onClose) {
  // 변수 역할: 모달의 키보드 포커스 범위 참조
  const dialogRef = useRef(null);
  // 변수 역할: 모달 닫기 버튼 참조
  const closeRef = useRef(null);

  // 최신 onClose 함수 보관
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    // 변수 역할: 모달 열기 전에 포커스가 있던 요소
    const previousFocus = document.activeElement;

    // 모달이 처음 열릴 때만 X 버튼으로 포커스 이동
    closeRef.current?.focus();

    const onKeyDown = (event) => {
      // ESC 키로 모달 닫기
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }

      // Tab 키가 아니면 처리하지 않음
      if (event.key !== 'Tab' || !dialogRef.current) {
        return;
      }

      const controls = [
        ...dialogRef.current.querySelectorAll(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled)',
        ),
      ];

      if (!controls.length) return;

      const first = controls[0];
      const last = controls[controls.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);

      // 모달 닫힐 때 이전 포커스 복원
      previousFocus?.focus?.();
    };
  }, []);

  return { dialogRef, closeRef };
}
