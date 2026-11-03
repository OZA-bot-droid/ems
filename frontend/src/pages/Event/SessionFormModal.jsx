// 세션 추가 / 수정 모달 (Figma "ADMIN — 세션 관리 / 수정 모달 열림")
// session이 없으면 "새 세션 추가", 있으면 "세션 수정"
// 검사 2겹: ① 화면에서 먼저(빈칸, 종료>시작, 행사 시간 안) ② 서버(겹침 등)가 거절하면 알맞은 자리에 표시
import { useState } from 'react';
import { eventApi } from '../api.js';
import { formatRange, instantToKstInput, kstToInstant } from '../format.js';
import DateTimeField from './DateTimeField.jsx';
import './session-manage.scss';

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
    if (!form.title.trim()) errors.title = '세션명을 입력하세요.';
    else if (form.title.length > 200) errors.title = '세션명은 200자까지 입력할 수 있습니다.';
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
      else setServerError(err); // SESSION_TIME_CONFLICT, EVENT_CLOSED, EVENT_OWNER_REQUIRED 등
    } finally {
      setSaving(false);
    }
  }

  return (
    // 어두운 배경 (바깥을 누르면 닫힘)
    <div className="session-modal-backdrop" onClick={onClose}>
      <form
        className="session-modal"
        onSubmit={submit}
        noValidate // 브라우저 영어 말풍선 대신 한국어 안내
        onClick={(e) => e.stopPropagation()} // 안쪽 클릭은 닫히지 않게
        aria-labelledby="session-modal-title"
      >
        <div className="session-modal-head">
          <div>
            <h2 id="session-modal-title">{isEdit ? '세션 수정' : '새 세션 추가'}</h2>
            <p>{isEdit ? '선택한 세션의 정보를 변경합니다.' : '선택한 행사에 새 세션을 추가합니다.'}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>

        <div className="session-modal-body">
          <div className="session-modal-field">
            <span>소속 행사</span>
            <p className="session-modal-readonly">{event.title} · 변경 불가</p>
          </div>

          <label className="session-modal-field">
            <span>세션명 *</span>
            <input
              id="ss-title"
              placeholder="예: 클라우드 아키텍처의 현재"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            {fieldErrors.title && <em>{fieldErrors.title}</em>}
          </label>

          {/* 날짜 + 시 + 분(5분 단위). 행사 시작~종료 밖은 고를 수 없음 */}
          <div className="session-modal-grid">
            <label className="session-modal-field">
              <span>시작 일시 *</span>
              <DateTimeField
                id="ss-start"
                compact
                value={form.startsAt}
                min={eventStart}
                max={eventEnd}
                onChange={(v) => setForm((f) => ({ ...f, startsAt: v }))}
              />
              {fieldErrors.startsAt && <em>{fieldErrors.startsAt}</em>}
            </label>
            <label className="session-modal-field">
              <span>종료 일시 *</span>
              <DateTimeField
                id="ss-end"
                compact
                value={form.endsAt}
                min={form.startsAt || eventStart}
                max={eventEnd}
                onChange={(v) => setForm((f) => ({ ...f, endsAt: v }))}
              />
              {fieldErrors.endsAt && <em>{fieldErrors.endsAt}</em>}
            </label>
          </div>

          {serverError && (
            <p className="session-modal-error">
              {serverError.message} <span>({serverError.code})</span>
            </p>
          )}

          <p className="session-modal-hint">
            종료 시각은 시작 시각 이후이며 행사 일정({formatRange(event.startsAt, event.endsAt)}) 범위에 포함되어야
            합니다.
          </p>
        </div>

        <div className="session-modal-foot">
          <button type="button" className="is-cancel" onClick={onClose}>
            취소
          </button>
          <button type="submit" className="is-save" disabled={saving}>
            {saving ? '저장 중…' : isEdit ? '변경사항 저장' : '세션 추가'}
          </button>
        </div>
      </form>
    </div>
  );
}
