// 10 · 세션 추가 / 수정 모달 (Figma "Modal / Session")
// session이 없으면 "새 세션 추가", 있으면 "세션 수정"
// 검사 2겹: ① 화면에서 먼저(빈칸, 종료>시작, 행사 시간 안) ② 서버(겹침 등)가 거절하면 알맞은 자리에 표시
import { useState } from 'react';
import { eventApi } from '../api.js';
import { formatRange, instantToKstInput, kstToInstant } from '../format.js';
import DateTimeField from './DateTimeField.jsx';

export default function SessionFormModal({ event, session, onClose, onSaved }) {
  const isEdit = Boolean(session);
  const eventStart = instantToKstInput(event.startsAt); // 예: "2027-11-01T10:00" (한국 시간)
  const eventEnd = instantToKstInput(event.endsAt);

  const [form, setForm] = useState({
    title: session?.title ?? '',
    startsAt: instantToKstInput(session?.startsAt),
    endsAt: instantToKstInput(session?.endsAt),
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [saving, setSaving] = useState(false);

  // 1차 검사 (서버 규칙과 같은 내용. 겹침은 다른 세션 정보가 필요해서 서버에 맡김)
  function validate() {
    const errors = {};
    if (!form.title.trim()) errors.title = '세션 제목을 입력하세요.';
    else if (form.title.length > 200) errors.title = '세션 제목은 200자까지 입력할 수 있습니다.';
    if (!form.startsAt) errors.startsAt = '시작 일시를 입력하세요.';
    if (!form.endsAt) errors.endsAt = '종료 일시를 입력하세요.';
    if (form.startsAt && form.endsAt) {
      if (form.endsAt <= form.startsAt) errors.endsAt = '종료 일시는 시작 일시보다 뒤여야 합니다.';
      else if (form.startsAt < eventStart || form.endsAt > eventEnd)
        errors.startsAt = '세션은 행사 시간 안에서만 만들 수 있습니다.';
    }
    return errors;
  }

  async function submit(e) {
    e.preventDefault();
    setServerError(null);
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const body = {
      title: form.title.trim(),
      startsAt: kstToInstant(form.startsAt),
      endsAt: kstToInstant(form.endsAt),
    };

    setSaving(true);
    try {
      const saved = isEdit
        ? await eventApi.updateSession(event.id, session.id, body)
        : await eventApi.createSession(event.id, body);
      onSaved(saved);
    } catch (err) {
      // 2차 검사: 서버가 거절한 이유를 알맞은 자리에
      if (err.code === 'INVALID_PERIOD') setFieldErrors({ endsAt: err.message });
      else if (err.code === 'SESSION_OUT_OF_EVENT') setFieldErrors({ startsAt: err.message });
      else setServerError(err); // SESSION_TIME_CONFLICT, EVENT_OWNER_REQUIRED 등
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(20,34,56,0.45)] px-4 py-10"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        noValidate // 브라우저 영어 말풍선 대신 한국어 안내
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[600px] rounded-[18px] bg-(--ems-surface) px-[30px] pt-6 pb-5"
      >
        <div className="flex items-start justify-between gap-4 border-b border-(--ems-line) pb-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-[23px] font-bold text-(--ems-ink)">{isEdit ? '세션 수정' : '새 세션 추가'}</h2>
            <p className="text-xs text-(--ems-muted)">{event.title}</p>
          </div>
          <button type="button" onClick={onClose} className="text-[23px] leading-none text-(--ems-muted)" aria-label="닫기">
            ×
          </button>
        </div>

        <div className="flex flex-col gap-5 py-5">
          <Field label="세션 제목 *" error={fieldErrors.title}>
            <input
              id="ss-title"
              className={inputClass}
              placeholder="예: 클라우드 아키텍처의 현재"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </Field>

          {/* 날짜 + 시 + 분(5분 단위). 달력은 행사 날짜 안에서만 고를 수 있음 */}
          <Field label="시작 일시 *" error={fieldErrors.startsAt}>
            <DateTimeField
              id="ss-start"
              value={form.startsAt}
              min={eventStart} // 행사 시작~종료 안에서만 고를 수 있음
              max={eventEnd}
              onChange={(v) => setForm((f) => ({ ...f, startsAt: v }))}
            />
          </Field>
          <Field label="종료 일시 *" error={fieldErrors.endsAt}>
            <DateTimeField
              id="ss-end"
              value={form.endsAt}
              min={form.startsAt || eventStart}
              max={eventEnd}
              onChange={(v) => setForm((f) => ({ ...f, endsAt: v }))}
            />
          </Field>

          {serverError && (
            <p className="rounded-[8px] bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700">
              {serverError.message} <span className="text-rose-400">({serverError.code})</span>
            </p>
          )}

          <p className="rounded-[8px] bg-(--ems-green-soft) px-4 py-2.5 text-xs font-semibold text-(--ems-green)">
            행사 시간 {formatRange(event.startsAt, event.endsAt)} 안에서, 다른 세션과 겹치지 않게 정하세요.
          </p>
        </div>

        <div className="flex gap-4 border-t border-(--ems-line) pt-4">
          <button type="button" onClick={onClose} className="h-[43px] flex-1 rounded-[9px] bg-(--ems-bg) text-[13px] font-semibold text-(--ems-ink)">
            취소
          </button>
          <button type="submit" disabled={saving} className="h-[43px] flex-1 rounded-[9px] bg-(--ems-green) text-[13px] font-semibold text-white hover:bg-(--ems-green-dark) disabled:opacity-60">
            {saving ? '저장 중…' : isEdit ? '변경사항 저장' : '세션 추가'}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  'h-[43px] w-full rounded-[9px] border border-transparent bg-(--ems-bg) px-3.5 text-[13px] text-(--ems-ink) placeholder:text-(--ems-muted) focus:border-(--ems-green) focus:outline-none';

function Field({ label, error, children }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-(--ems-ink)">{label}</span>
      {children}
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </label>
  );
}
