// 09 · 행사 등록 / 수정 모달 (Figma "Modal / Create Event")
// event가 없으면 "새 행사 등록", 있으면 "행사 수정"으로 동작합니다.
// 새 등록일 때는 [+ 세션 추가]로 세션을 같이 적어 두면, 행사를 만든 직후 세션도 차례로 만듭니다.
import { useRef, useState } from 'react';
import { eventApi } from '../api.js';
import { instantToKstInput, kstToInstant, nowKstInput } from '../format.js';
import DateTimeField from './DateTimeField.jsx';

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

  // 함께 만들 세션들 (새 등록일 때만). key는 목록에서 줄을 구분하는 이름표
  const [sessions, setSessions] = useState([]);
  const [sessionErrors, setSessionErrors] = useState({}); // { [key]: { title, startsAt, endsAt } }
  const nextKey = useRef(1);

  const addSession = () =>
    setSessions((list) => [...list, { key: nextKey.current++, title: '', startsAt: '', endsAt: '' }]);
  const removeSession = (key) => setSessions((list) => list.filter((s) => s.key !== key));
  const changeSession = (key, name, value) =>
    setSessions((list) => list.map((s) => (s.key === key ? { ...s, [name]: value } : s)));

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

  // 세션 1차 검사: 빈칸, 종료>시작, 행사 시간 안, 세션끼리 겹침
  // (아직 서버에 없는 세션들이라 겹침도 화면에서 미리 확인할 수 있습니다)
  function validateSessions() {
    const errors = {};
    const put = (key, name, msg) => (errors[key] = { ...errors[key], [name]: msg });
    const eventOk = form.startsAt && form.endsAt && form.endsAt > form.startsAt;

    for (const s of sessions) {
      if (!s.title.trim()) put(s.key, 'title', '세션 제목을 입력하세요.');
      else if (s.title.length > 200) put(s.key, 'title', '세션 제목은 200자까지 입력할 수 있습니다.');
      if (!s.startsAt) put(s.key, 'startsAt', '시작 일시를 입력하세요.');
      if (!s.endsAt) put(s.key, 'endsAt', '종료 일시를 입력하세요.');
      if (s.startsAt && s.endsAt) {
        if (s.endsAt <= s.startsAt) put(s.key, 'endsAt', '종료 일시는 시작 일시보다 뒤여야 합니다.');
        else if (eventOk && (s.startsAt < form.startsAt || s.endsAt > form.endsAt))
          put(s.key, 'startsAt', '세션은 행사 시간 안에서만 만들 수 있습니다.');
      }
    }

    // 시작 순으로 줄 세운 뒤, 앞 세션이 끝나기 전에 시작하면 겹침 (끝나는 시각에 바로 시작은 OK)
    const timed = sessions
      .filter((s) => !errors[s.key] && s.startsAt && s.endsAt)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    for (let i = 1; i < timed.length; i++) {
      if (timed[i].startsAt < timed[i - 1].endsAt)
        put(timed[i].key, 'startsAt', `"${timed[i - 1].title.trim()}" 세션과 시간이 겹칩니다.`);
    }
    return errors;
  }

  async function submit(e) {
    e.preventDefault(); // 폼 기본 동작(새로고침) 막기
    setServerError(null);
    const errors = validate();
    const sErrors = isEdit ? {} : validateSessions();
    setFieldErrors(errors);
    setSessionErrors(sErrors);
    if (Object.keys(errors).length > 0 || Object.keys(sErrors).length > 0) return;

    // 빈칸 처리: 새 등록은 null(값 없음). 수정은 ""(빈 글자)를 보내야 지워집니다.
    // (백엔드 update는 null을 "안 바꿈"으로 보기 때문에, 수정에서 null을 보내면 예전 값이 그대로 남음)
    const empty = isEdit ? '' : null;
    const body = {
      title: form.title.trim(),
      description: form.description.trim() || empty,
      startsAt: kstToInstant(form.startsAt),
      endsAt: kstToInstant(form.endsAt),
      capacity: Number(form.capacity),
      meetingUrl: form.meetingUrl.trim() || empty,
    };

    setSaving(true);
    let saved;
    try {
      saved = isEdit ? await eventApi.update(event.id, body) : await eventApi.create(body);
    } catch (err) {
      // 2차 검사: 서버가 거절한 이유를 알맞은 자리에 보여주기
      if (err.code === 'INVALID_PERIOD') setFieldErrors({ endsAt: err.message });
      else if (err.code === 'PAST_START_TIME') setFieldErrors({ startsAt: err.message });
      else setServerError(err);
      setSaving(false);
      return; // 행사가 안 만들어졌으면 세션도 만들지 않음
    }

    // 행사가 만들어졌으면, 적어 둔 세션을 시간 순서대로 하나씩 만들기
    const result = { created: 0, failed: [] };
    const ordered = [...sessions].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    for (const s of ordered) {
      try {
        await eventApi.createSession(saved.id, {
          title: s.title.trim(),
          startsAt: kstToInstant(s.startsAt),
          endsAt: kstToInstant(s.endsAt),
        });
        result.created++;
      } catch (err) {
        result.failed.push({ title: s.title.trim(), message: err.message });
      }
    }
    setSaving(false);
    // 행사는 이미 만들어졌으니 실패한 세션이 있어도 창을 닫고 알림으로 알려줍니다 (다시 누르면 행사가 두 개 생기므로)
    onSaved(saved, result);
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

          {/* 날짜 + 시 + 분(5분 단위). 지난 날짜·시작보다 앞선 날짜는 달력에서 고를 수 없음 */}
          <Field label="시작 일시 *" error={fieldErrors.startsAt}>
            <DateTimeField
              id="ev-start"
              value={form.startsAt}
              min={startChanged ? nowKstInput() : undefined} // 지난 시각은 고를 수 없음
              onChange={(v) => setForm((f) => ({ ...f, startsAt: v }))}
            />
          </Field>
          <Field label="종료 일시 *" error={fieldErrors.endsAt}>
            <DateTimeField
              id="ev-end"
              value={form.endsAt}
              min={form.startsAt || undefined} // 시작 이후만 고를 수 있음
              onChange={(v) => setForm((f) => ({ ...f, endsAt: v }))}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="참가 정원 *" error={fieldErrors.capacity}>
              <input id="ev-capacity" type="number" min="1" className={inputClass} placeholder="예: 80" value={form.capacity} onChange={change('capacity')} />
            </Field>
            <Field label="참여 URL" error={fieldErrors.meetingUrl}>
              <input id="ev-url" className={inputClass} placeholder="온라인 안내 주소 (승인된 참가자에게 공개)" value={form.meetingUrl} onChange={change('meetingUrl')} />
            </Field>
          </div>

          {/* 새 등록일 때만: 세션 함께 추가 */}
          {!isEdit && (
            <div className="flex flex-col gap-3 border-t border-(--ems-line) pt-5">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-(--ems-ink)">세션 {sessions.length > 0 && `· ${sessions.length}개`}</span>
                  <span className="text-[11px] text-(--ems-muted)">선택 · 행사 시간 안에서 겹치지 않게 (끝나는 시각에 바로 시작은 가능)</span>
                </div>
                <button
                  type="button"
                  onClick={addSession}
                  className="h-[34px] rounded-[8px] bg-(--ems-blue-soft) px-3.5 text-xs font-semibold text-(--ems-ink)"
                >
                  + 세션 추가
                </button>
              </div>

              {sessions.map((s, i) => {
                const err = sessionErrors[s.key] || {};
                return (
                  <div key={s.key} className="flex flex-col gap-3 rounded-[12px] border border-(--ems-line) p-4">
                    <div className="flex items-center justify-between">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-(--ems-bg) text-[11px] font-bold text-(--ems-muted)">
                        {i + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSession(s.key)}
                        className="text-xs font-semibold text-rose-600"
                      >
                        빼기
                      </button>
                    </div>
                    <Field label="세션 제목 *" error={err.title}>
                      <input
                        className={inputClass}
                        placeholder="예: 클라우드 아키텍처의 현재"
                        value={s.title}
                        onChange={(e) => changeSession(s.key, 'title', e.target.value)}
                      />
                    </Field>
                    <Field label="시작 일시 *" error={err.startsAt}>
                      <DateTimeField
                        id={`ns-${s.key}-start`}
                        value={s.startsAt}
                        min={form.startsAt || undefined} // 행사 시작~종료 안에서만 고를 수 있음
                        max={form.endsAt || undefined}
                        onChange={(v) => changeSession(s.key, 'startsAt', v)}
                      />
                    </Field>
                    <Field label="종료 일시 *" error={err.endsAt}>
                      <DateTimeField
                        id={`ns-${s.key}-end`}
                        value={s.endsAt}
                        min={s.startsAt || form.startsAt || undefined} // 세션 시작(없으면 행사 시작) 이후
                        max={form.endsAt || undefined}
                        onChange={(v) => changeSession(s.key, 'endsAt', v)}
                      />
                    </Field>
                  </div>
                );
              })}
            </div>
          )}

          {serverError && (
            <p className="rounded-[8px] bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700">
              {serverError.message} <span className="text-rose-400">({serverError.code})</span>
            </p>
          )}

          <p className="rounded-[8px] bg-(--ems-green-soft) px-4 py-2.5 text-xs font-semibold text-(--ems-green)">
            {isEdit ? '행사 기간을 줄일 때는 세션이 기간 안에 있어야 합니다.' : '세션은 지금 함께 추가하거나, 등록 후 세션 관리에서 추가할 수 있습니다. 새 행사는 "작성 중"으로 시작합니다.'}
          </p>
        </div>

        {/* 아래 버튼 */}
        <div className="flex gap-4 border-t border-(--ems-line) pt-4">
          <button type="button" onClick={onClose} className="h-[43px] flex-1 rounded-[9px] bg-(--ems-bg) text-[13px] font-semibold text-(--ems-ink)">
            취소
          </button>
          <button type="submit" disabled={saving} className="h-[43px] flex-1 rounded-[9px] bg-(--ems-green) text-[13px] font-semibold text-white hover:bg-(--ems-green-dark) disabled:opacity-60">
            {saving
              ? '저장 중…'
              : isEdit
                ? '변경사항 저장'
                : sessions.length > 0
                  ? `행사 + 세션 ${sessions.length}개 등록`
                  : '행사 등록'}
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
