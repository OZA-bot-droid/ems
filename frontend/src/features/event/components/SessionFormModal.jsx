import { mapClassNames } from '../../../styles/classNames.js';
import style0 from '../styles/session-manage.module.scss';
const cx = value => mapClassNames(value, style0);
// 세션 추가 / 수정 모달 (Figma "ADMIN — 세션 관리 / 수정 모달 열림")
// session이 없으면 "새 세션 추가", 있으면 "세션 수정"
// 검사 2겹: ① 화면에서 먼저(빈칸, 종료>시작, 행사 시간 안, 다른 세션과 겹침) ② 서버가 거절하면 알맞은 자리에 표시
// 이미 다른 세션이 있는 시간대는 시작·종료 선택칸에서 고를 수 없게(회색) 막습니다.
import { useState } from 'react';
import { eventApi } from '../api/eventApi.js';
import { formatRange, formatTimeRange, instantToKstInput, kstToInstant } from '../utils/format.js';
import DateTimeField from './DateTimeField.jsx';

export default function SessionFormModal({ event, session, sessions = [], onClose, onSaved }) {
  const isEdit = Boolean(session);
  const eventStart = instantToKstInput(event.startsAt); // 예: "2027-11-01T10:00" (한국 시간)
  const eventEnd = instantToKstInput(event.endsAt);

  const [form, setForm] = useState({
    title: session?.title ?? '',
    startsAt: instantToKstInput(session?.startsAt),
    endsAt: instantToKstInput(session?.endsAt),
  });
  // 이미 잡혀 있는 다른 세션 시간대 (수정 중이면 자기 자신은 빼고). 서버와 같은 규칙: 딱 붙는 건 겹침 아님
  const others = sessions.filter((s) => s.id !== session?.id);
  const busy = others.map((s) => ({
    start: instantToKstInput(s.startsAt),
    end: instantToKstInput(s.endsAt),
  }));
  // 시작 시각 t: 다른 세션 진행 중이면 막음 (start <= t < end)
  const startBlocked = (t) => busy.some((b) => b.start <= t && t < b.end);
  // 종료 시각 t: [시작, t) 가 다른 세션과 겹치면 막음 (시작을 아직 안 골랐으면 start < t <= end)
  const endBlocked = (t) => busy.some((b) => b.start < t && b.end > (form.startsAt || t));
  const overlaps = (s, e) => busy.some((b) => b.start < e && b.end > s);

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
      else if (overlaps(form.startsAt, form.endsAt))
        errors.endsAt = '같은 시간대에 이미 다른 세션이 있습니다.';
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
    <div className={cx("session-modal-backdrop")} onClick={onClose}>
      <form
        className={cx("session-modal")}
        onSubmit={submit}
        noValidate // 브라우저 영어 말풍선 대신 한국어 안내
        onClick={(e) => e.stopPropagation()} // 안쪽 클릭은 닫히지 않게
        aria-labelledby="session-modal-title"
      >
        <div className={cx("session-modal-head")}>
          <div>
            <h2 id="session-modal-title">{isEdit ? '세션 수정' : '새 세션 추가'}</h2>
            <p>{isEdit ? '선택한 세션의 정보를 변경합니다.' : '선택한 행사에 새 세션을 추가합니다.'}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>

        <div className={cx("session-modal-body")}>
          <div className={cx("session-modal-field")}>
            <span>소속 행사</span>
            <p className={cx("session-modal-readonly")}>{event.title} · 변경 불가</p>
          </div>

          <label className={cx("session-modal-field")}>
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
          <div className={cx("session-modal-grid")}>
            <label className={cx("session-modal-field")}>
              <span>시작 일시 *</span>
              <DateTimeField
                id="ss-start"
                compact
                value={form.startsAt}
                min={eventStart}
                max={eventEnd}
                isBlocked={startBlocked}
                onChange={(v) => setForm((f) => ({ ...f, startsAt: v }))}
              />
              {fieldErrors.startsAt && <em>{fieldErrors.startsAt}</em>}
            </label>
            <label className={cx("session-modal-field")}>
              <span>종료 일시 *</span>
              <DateTimeField
                id="ss-end"
                compact
                value={form.endsAt}
                min={form.startsAt || eventStart}
                max={eventEnd}
                isBlocked={endBlocked}
                onChange={(v) => setForm((f) => ({ ...f, endsAt: v }))}
              />
              {fieldErrors.endsAt && <em>{fieldErrors.endsAt}</em>}
            </label>
          </div>

          {serverError && (
            <p className={cx("session-modal-error")}>
              {serverError.message} <span>({serverError.code})</span>
            </p>
          )}

          {others.length > 0 && (
            <p className={cx("session-modal-hint")}>
              이미 있는 세션(선택 불가):{' '}
              {others.map((s) => `${formatTimeRange(s.startsAt, s.endsAt)} ${s.title}`).join(' · ')}
            </p>
          )}

          <p className={cx("session-modal-hint")}>
            종료 시각은 시작 시각 이후이며 행사 일정({formatRange(event.startsAt, event.endsAt)}) 범위에 포함되어야
            합니다.
          </p>
        </div>

        <div className={cx("session-modal-foot")}>
          <button type="button" className={cx("is-cancel")} onClick={onClose}>
            취소
          </button>
          <button type="submit" className={cx("is-save")} disabled={saving}>
            {saving ? '저장 중…' : isEdit ? '변경사항 저장' : '세션 추가'}
          </button>
        </div>
      </form>
    </div>
  );
}
