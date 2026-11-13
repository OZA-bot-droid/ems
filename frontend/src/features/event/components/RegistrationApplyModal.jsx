import { mapClassNames } from '../../../styles/classNames.js';
import module0 from '../styles/registration-page.module.scss';
import module1 from '../styles/event-manage.module.scss';
const cx = value => mapClassNames(value, module0, module1);
import { useEffect, useState } from 'react';

export default function RegistrationApplyModal({ event, applying, error, onClose, onSubmit }) {
  const [consented, setConsented] = useState(false);
  const [consentError, setConsentError] = useState('');

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !applying) onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [applying, onClose]);

  function submit(event) {
    event.preventDefault();
    if (!consented) {
      setConsentError('참가 신청 안내에 동의해 주세요.');
      return;
    }
    setConsentError('');
    onSubmit();
  }

  return (
    <div
      className={cx("fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[rgba(16,26,42,0.57)] px-4 py-8")}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !applying) onClose();
      }}
    >
      <section
        aria-labelledby="registration-apply-title"
        aria-modal="true"
        className={cx("my-auto w-full max-w-[620px] rounded-[18px] bg-(--ems-surface) px-7 pt-6 pb-5 shadow-[0_20px_60px_rgba(16,26,42,0.22)]")}
        role="dialog"
      >
        <form onSubmit={submit}>
          <header className={cx("flex items-start justify-between gap-4")}>
            <div>
              <h2 id="registration-apply-title" className={cx("text-[28px] font-semibold text-(--ems-ink)")}>
                행사 참가 신청
              </h2>
              <p className={cx("mt-1 text-[13px] font-normal text-(--ems-muted)")}>
                선택한 행사의 참가 신청 내용을 확인하세요.
              </p>
            </div>
            <button
              aria-label="신청 창 닫기"
              className={cx("-mr-1 -mt-1 p-1 text-[25px] leading-none text-(--ems-muted) hover:text-(--ems-ink) disabled:opacity-50")}
              disabled={applying}
              onClick={onClose}
              type="button"
            >
              ×
            </button>
          </header>

          <div className={cx("mt-5 rounded-[12px] bg-(--ems-green-soft) px-[17px] py-[14px]")}>
            <p className={cx("text-[14px] font-semibold text-(--ems-green)")}>신청 행사</p>
            <p className={cx("mt-1 text-[13px] font-normal text-(--ems-ink)")}>{event.title}</p>
          </div>

          <div className={cx("mt-5 flex flex-col gap-4")}>
            <ReadOnlyField label="신청자 이름" />
            <ReadOnlyField label="이메일" />
          </div>

          <div className={cx("mt-5")}>
            <h3 className={cx("text-[14px] font-semibold text-(--ems-ink)")}>참가 안내</h3>
            <p className={cx("mt-2 text-[13px] font-normal leading-5 text-(--ems-muted)")}>
              신청 후 관리자의 승인이 필요하며, 결과는 나의 신청 내역에서 확인합니다.
            </p>
          </div>

          <label className={cx("mt-6 flex cursor-pointer items-start gap-2.5 text-[13px] font-normal leading-5 text-(--ems-ink)")}>
            <input
              checked={consented}
              className={cx("mt-0.5 size-[17px] shrink-0 accent-(--ems-green)")}
              onChange={(event) => {
                setConsented(event.target.checked);
                if (event.target.checked) setConsentError('');
              }}
              type="checkbox"
            />
            <span>[필수] 참가 신청 및 개인정보 처리 안내를 확인했습니다.</span>
          </label>

          {(consentError || error) && (
            <p className={cx("mt-2 text-[13px] font-normal text-rose-600")} role="alert">
              {consentError || error}
            </p>
          )}

          <div className={cx("mt-7 border-t border-(--ems-line) pt-5")}>
            <div className={cx("grid grid-cols-[1fr_1.13fr] gap-3")}>
              <button
                className={cx("h-[50px] rounded-[10px] bg-(--ems-bg) text-[14px] font-semibold text-(--ems-ink) hover:bg-slate-100 disabled:opacity-60")}
                disabled={applying}
                onClick={onClose}
                type="button"
              >
                취소
              </button>
              <button
                className={cx("h-[50px] rounded-[10px] bg-(--ems-green) text-[14px] font-semibold text-white hover:bg-(--ems-green-dark) disabled:cursor-not-allowed disabled:opacity-60")}
                disabled={applying}
                type="submit"
              >
                {applying ? '신청 중…' : '참가 신청 완료'}
              </button>
            </div>
            <p className={cx("mt-2 text-[13px] font-normal text-(--ems-muted)")}>
              ※ 필수 동의 후 제출 가능 · 중복 신청/정원 초과는 서버에서 검증
            </p>
          </div>
        </form>
      </section>
    </div>
  );
}

function ReadOnlyField({ label }) {
  return (
    <div>
      <p className={cx("text-[14px] font-semibold text-(--ems-ink)")}>{label}</p>
      <div className={cx("mt-2 flex h-[44px] items-center rounded-[8px] bg-(--ems-bg) px-[14px] text-[13px] font-normal text-(--ems-muted)")}>
        로그인 회원 {label === '이메일' ? '이메일' : '이름'} · 자동 입력
      </div>
    </div>
  );
}
