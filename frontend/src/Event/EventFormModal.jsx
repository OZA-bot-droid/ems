// 09 · 행사 등록 / 수정 모달 (Figma "Modal / Create Event")
// event가 없으면 "새 행사 등록", 있으면 "행사 수정"으로 동작합니다.
import { useState } from 'react';
import { eventApi } from '../api.js';
import { instantToKstInput, kstToInstant, nowKstInput } from '../format.js';

export default function EventFormModal({ event, onClose, onSaved }) {
  const isEdit = Boolean(event);

  // 입력칸 값 (시간은 한국 시간 문자열로 들고 있다가, 보낼 때 UTC로 바꿉니다)
  const [form, setForm] = useState({
    title: event?.title ?? '',
    description: event?.description ?? '',
    startsAt: instantToKstInput(event?.startsAt),
    endsAt: instantToKstInput(event?.endsAt),
    capacity: event?.capacity ?? '',
    meetingUrl: event?.meetingUrl ?? '',
  });
  const [fieldErrors, setFieldErrors] = useState({}); // 칸별 빨간 글씨
  const [serverError, setServerError] = useState(null); // 서버가 거절했을 때
  const [saving, setSaving] = useState(false);

  // 시작 일시를 검사할지: 새 등록이면 항상, 수정이면 시작 일시를 바꿨을 때만
  // (이미 지난 행사의 설명만 고칠 때 막히지 않도록)
  const startChanged = !isEdit || form.startsAt !== instantToKstInput(event.startsAt);

  const change = (name) => (e) => setForm({ ...form, [name]: e.target.value });

  // 1차 검사: 서버에 보내기 전에 화면에서 먼저 (백엔드 규칙과 같은 내용)
  function validate() {
    const errors = {};
    if (!form.title.trim()) errors.title = '행사명을 입력하세요.';
    else if (form.title.length > 200) errors.title = '행사명은 200자까지 입력할 수 있습니다.';
    if (!form.startsAt) errors.startsAt = '시작 일시를 입력하세요.';
    else if (startChanged && form.startsAt <= nowKstInput())
      errors.startsAt = '시작 일시는 현재 시간 이후로 설정하세요.';
    if (!form.endsAt) errors.endsAt = '종료 일시를 입력하세요.';
    if (form.startsAt && form.endsAt && form.endsAt <= form.startsAt)
      errors.endsAt = '종료 일시는 시작 일시보다 뒤여야 합니다.';
    if (!form.capacity || Number(form.capacity) < 1) errors.capacity = '참가 정원은 1명 이상이어야 합니다.';
    if (form.meetingUrl.length > 500) errors.meetingUrl = '500자까지 입력할 수 있습니다.';
    return errors;
  }

  async function submit(e) {
    e.preventDefault(); // 폼 기본 동작(새로고침) 막기
    setServerError(null);
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const body = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      startsAt: kstToInstant(form.startsAt),
      endsAt: kstToInstant(form.endsAt),
      capacity: Number(form.capacity),
      meetingUrl: form.meetingUrl.trim() || null,
    };

    setSaving(true);
    try {
      const saved = isEdit ? await eventApi.update(event.id, body) : await eventApi.create(body);
      onSaved(saved);
    } catch (err) {
      // 2차 검사: 서버가 거절한 이유를 알맞은 자리에 보여주기
      if (err.code === 'INVALID_PERIOD') setFieldErrors({ endsAt: err.message });
      else if (err.code === 'PAST_START_TIME') setFieldErrors({ startsAt: err.message });
      else setServerError(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    // 어두운 배경 (바깥을 누르면 닫힘)
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(20,34,56,0.45)] px-4 py-10"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        noValidate // 브라우저 기본 경고(영어 말풍선) 대신 우리 한국어 안내를 쓰기
        onClick={(e) => e.stopPropagation()} // 안쪽 클릭은 닫히지 않게
        className="w-full max-w-[670px] rounded-[18px] bg-(--ems-surface) px-[30px] pt-6 pb-5"
      >
        {/* 머리 */}
        <div className="flex items-start justify-between gap-4 border-b border-(--ems-line) pb-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-[23px] font-bold text-(--ems-ink)">{isEdit ? '행사 수정' : '새 행사 등록'}</h2>
            <p className="text-xs text-(--ems-muted)">
              {isEdit ? '바꿀 내용을 고친 뒤 저장하세요.' : '행사 정보를 입력하여 새로운 이벤트를 생성합니다.'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-[23px] leading-none text-(--ems-muted)" aria-label="닫기">
            ×
          </button>
        </div>

        <div className="flex flex-col gap-5 py-5">
          <Field label="행사명 *" error={fieldErrors.title}>
            <input id="ev-title" className={inputClass} placeholder="예: 클라우드 네이티브 컨퍼런스" value={form.title} onChange={change('title')} />
          </Field>

          <Field label="행사 설명" error={fieldErrors.description}>
            <textarea id="ev-desc" rows={3} className={`${inputClass} h-20 resize-none py-3`} placeholder="행사의 목적과 주요 내용을 입력하세요." value={form.description} onChange={change('description')} />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="시작 일시 *" error={fieldErrors.startsAt}>
              <input id="ev-start" type="datetime-local" min={startChanged ? nowKstInput() : undefined} className={inputClass} value={form.startsAt} onChange={change('startsAt')} />
            </Field>
            <Field label="종료 일시 *" error={fieldErrors.endsAt}>
              <input id="ev-end" type="datetime-local" min={form.startsAt || undefined} className={inputClass} value={form.endsAt} onChange={change('endsAt')} />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="참가 정원 *" error={fieldErrors.capacity}>
              <input id="ev-capacity" type="number" min="1" className={inputClass} placeholder="예: 80" value={form.capacity} onChange={change('capacity')} />
            </Field>
            <Field label="참여 URL" error={fieldErrors.meetingUrl}>
              <input id="ev-url" className={inputClass} placeholder="온라인 안내 주소 (승인된 참가자에게 공개)" value={form.meetingUrl} onChange={change('meetingUrl')} />
            </Field>
          </div>

          {serverError && (
            <p className="rounded-[8px] bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700">
              {serverError.message} <span className="text-rose-400">({serverError.code})</span>
            </p>
          )}

          <p className="rounded-[8px] bg-(--ems-green-soft) px-4 py-2.5 text-xs font-semibold text-(--ems-green)">
            {isEdit ? '행사 기간을 줄일 때는 세션이 기간 안에 있어야 합니다.' : '행사 등록 후 세션 관리에서 세션을 추가할 수 있습니다. 새 행사는 "작성 중"으로 시작합니다.'}
          </p>
        </div>

        {/* 아래 버튼 */}
        <div className="flex gap-4 border-t border-(--ems-line) pt-4">
          <button type="button" onClick={onClose} className="h-[43px] flex-1 rounded-[9px] bg-(--ems-bg) text-[13px] font-semibold text-(--ems-ink)">
            취소
          </button>
          <button type="submit" disabled={saving} className="h-[43px] flex-1 rounded-[9px] bg-(--ems-green) text-[13px] font-semibold text-white hover:bg-(--ems-green-dark) disabled:opacity-60">
            {saving ? '저장 중…' : isEdit ? '변경사항 저장' : '행사 등록'}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  'h-[43px] w-full rounded-[9px] border border-transparent bg-(--ems-bg) px-3.5 text-[13px] text-(--ems-ink) placeholder:text-(--ems-muted) focus:border-(--ems-green) focus:outline-none';

// 이름표 + 입력칸 + 빨간 안내 한 묶음
function Field({ label, error, children }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-(--ems-ink)">{label}</span>
      {children}
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </label>
  );
}
