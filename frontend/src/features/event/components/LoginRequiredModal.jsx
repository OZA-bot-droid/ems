// 로그인이 필요한 기능을 비로그인 상태로 눌렀을 때 뜨는 확인 창
// [확인] → onConfirm (로그인 화면으로 이동) / [취소]·바깥 클릭·Esc → onClose
import { useEffect } from 'react';

export default function LoginRequiredModal({ onClose, onConfirm }) {
  // Esc 키로 닫기 (창이 사라질 때 이벤트 등록도 같이 해제)
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    // 어두운 배경 (바깥을 누르면 닫힘)
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(16,26,42,0.57)] px-4 py-8"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="login-required-title"
        aria-modal="true"
        role="alertdialog"
        className="w-full max-w-[400px] rounded-[18px] bg-(--ems-surface) px-7 pt-6 pb-5 shadow-[0_20px_60px_rgba(16,26,42,0.22)]"
      >
        <h2 id="login-required-title" className="text-[18px] font-bold text-(--ems-ink)">
          로그인이 필요합니다.
        </h2>
        <p className="mt-2 text-[13px] leading-6 text-(--ems-muted)">로그인 화면으로 이동하시겠어요?</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-[44px] rounded-[10px] bg-(--ems-bg) text-[13px] font-semibold text-(--ems-ink) hover:bg-slate-100"
          >
            취소
          </button>
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            className="h-[44px] rounded-[10px] bg-(--ems-green) text-[13px] font-semibold text-white hover:bg-(--ems-green-dark)"
          >
            확인
          </button>
        </div>
      </section>
    </div>
  );
}
