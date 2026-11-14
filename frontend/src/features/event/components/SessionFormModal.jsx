import { mapClassNames } from '../../../styles/classNames.js';
import style0 from '../styles/session-manage.module.scss';
const cx = value => mapClassNames(value, style0);
// 세션 추가 / 수정 모달 (Figma "ADMIN — 세션 관리 / 수정 모달 열림")
// session이 없으면 "새 세션 추가"(여러 개를 한 번에 등록할 수 있음), 있으면 "세션 수정"(한 개만)
// 검사 2겹: ① 화면에서 먼저(빈칸, 종료>시작, 행사 시간 안, 다른 세션과 겹침) ② 서버가 거절하면 알맞은 자리에 표시
// 이미 다른 세션이 있는 시간대(+ 이 창에서 적어 둔 다른 줄)는 선택칸에서 아예 보이지 않습니다.
import { useRef, useState } from 'react';
import { eventApi } from '../api/eventApi.js';
import { formatRange, formatTimeRange, instantToKstInput, kstToInstant } from '../utils/format.js';
import DateTimeField from './DateTimeField.jsx';

export default function SessionFormModal({ event, session, sessions = [], onClose, onSaved }) {
  const isEdit = Boolean(session);
  const eventStart = instantToKstInput(event.startsAt); // 예: "2027-11-01T10:00" (한국 시간)
  const eventEnd = instantToKstInput(event.endsAt);

  // 입력 줄 목록. 수정일 때는 항상 한 줄, 새로 등록할 때는 [+ 세션 추가]로 줄을 늘린다
  const nextKey = useRef(1);
  const [rows, setRows] = useState(() => [
    {
      key: 0,
      title: session?.title ?? '',
      startsAt: instantToKstInput(session?.startsAt),
      endsAt: instantToKstInput(session?.endsAt),
    },
  ]);
  const addRow = () =>
    setRows((list) => [...list, { key: nextKey.current++, title: '', startsAt: '', endsAt: '' }]);
  const removeRow = (key) => setRows((list) => list.filter((r) => r.key !== key));
  const changeRow = (key, name, value) =>
    setRows((list) => list.map((r) => (r.key === key ? { ...r, [name]: value } : r)));

  // 이미 잡혀 있는 시간대 = 저장된 다른 세션 + 이 창에서 적어 둔 다른 줄 (수정 중이면 자기 자신은 빼고)
  // 서버와 같은 규칙: 딱 붙는 건 겹침 아님
  const others = sessions.filter((s) => s.id !== session?.id);
  const busyFor = (key) => [
    ...others.map((s) => ({ start: instantToKstInput(s.startsAt), end: instantToKstInput(s.endsAt) })),
    ...rows
      .filter((r) => r.key !== key && r.startsAt && r.endsAt && r.endsAt > r.startsAt)
      .map((r) => ({ start: r.startsAt, end: r.endsAt })),
  ];
  // 시작 시각 t: 다른 세션이 진행 중이면 막음 (start <= t < end)
  const startBlocked = (key) => (t) => busyFor(key).some((b) => b.start <= t && t < b.end);
  // 종료 시각 t: 자기 시작과 같거나 앞서면 막고, [시작, t) 가 다른 세션과 겹쳐도 막음
  const endBlocked = (key, startsAt) => (t) =>
    (Boolean(startsAt) && t <= startsAt) ||
    busyFor(key).some((b) => b.start < t && b.end > (startsAt || t));
  const overlaps = (key, s, e) => busyFor(key).some((b) => b.start < e && b.end > s);

  const [fieldErrors, setFieldErrors] = useState({}); // { 줄 번호: { title, startsAt, endsAt } }
  const [serverError, setServerError] = useState(null);
  const [saving, setSaving] = useState(false);

  // 1차 검사 (서버 규칙과 같은 내용)
  function validate() {
    const errors = {};
    const put = (key, name, msg) => (errors[key] = { ...errors[key], [name]: msg });
    for (const r of rows) {
      if (!r.title.trim()) put(r.key, 'title', '세션명을 입력하세요.');
      else if (r.title.length > 200) put(r.key, 'title', '세션명은 200자까지 입력할 수 있습니다.');
      if (!r.startsAt) put(r.key, 'startsAt', '시작 일시를 입력하세요.');
      if (!r.endsAt) put(r.key, 'endsAt', '종료 일시를 입력하세요.');
      if (r.startsAt && r.endsAt) {
        if (r.endsAt <= r.startsAt) put(r.key, 'endsAt', '종료 일시는 시작 일시보다 뒤여야 합니다.');
        else if (r.startsAt < eventStart || r.endsAt > eventEnd)
          put(r.key, 'startsAt', '세션은 행사 시간 안에서만 만들 수 있습니다.');
        else if (overlaps(r.key, r.startsAt, r.endsAt))
          put(r.key, 'endsAt', '같은 시간대에 이미 다른 세션이 있습니다.');
      }
    }
    return errors;
  }

  // 서버가 거절한 이유를 알맞은 칸에 (2차 검사)
  const serverFieldError = (err) =>
    err.code === 'INVALID_PERIOD'
      ? { endsAt: err.message }
      : err.code === 'SESSION_OUT_OF_EVENT'
        ? { startsAt: err.message }
        : null;

  async function submit(e) {
    e.preventDefault();
    setServerError(null);
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const bodyOf = (r) => ({
      title: r.title.trim(),
      startsAt: kstToInstant(r.startsAt),
      endsAt: kstToInstant(r.endsAt),
    });

    setSaving(true);

    // 수정: 한 개만
    if (isEdit) {
      try {
        onSaved(await eventApi.updateSession(event.id, session.id, bodyOf(rows[0])));
      } catch (err) {
        const field = serverFieldError(err);
        if (field) setFieldErrors({ [rows[0].key]: field });
        else setServerError(err); // SESSION_TIME_CONFLICT, EVENT_CLOSED, EVENT_OWNER_REQUIRED 등
      } finally {
        setSaving(false);
      }
      return;
    }

    // 새 등록: 시간 순서대로 하나씩 만든다 (하나가 실패해도 나머지는 계속)
    const ordered = [...rows].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    const result = { created: 0, failed: [] };
    let first = null;
    for (const r of ordered) {
      try {
        const saved = await eventApi.createSession(event.id, bodyOf(r));
        result.created += 1;
        first = first ?? saved;
      } catch (err) {
        result.failed.push({ key: r.key, title: r.title.trim(), message: err.message, err });
      }
    }
    setSaving(false);

    // 하나도 못 만들었으면 창을 닫지 않고 이유를 보여 준다
    if (result.created === 0) {
      const only = result.failed.length === 1 ? result.failed[0] : null;
      const field = only && serverFieldError(only.err);
      if (field) setFieldErrors({ [only.key]: field });
      else if (only) setServerError(only.err);
      else
        setServerError({
          code: 'SESSION_CREATE_FAILED',
          message: result.failed.map((f) => `${f.title}: ${f.message}`).join(' / '),
        });
      return;
    }
    onSaved(first, result);
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
            <h2 id="session-modal-title">{isEdit ? '세션 수정' : '세션 추가'}</h2>
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

          {/* 새로 등록할 때만: 줄을 늘려 여러 세션을 한 번에 등록 */}
          {!isEdit && (
            <div className={cx("flex items-center justify-between")}>
              <span className={cx("text-[13px] font-bold text-(--ems-ink)")}>
                세션 {rows.length > 1 && `· ${rows.length}개`}
              </span>
              <button
                type="button"
                onClick={addRow}
                className={cx("h-[34px] rounded-[8px] bg-(--ems-blue-soft) px-3.5 text-xs font-semibold text-(--ems-ink)")}
              >
                + 세션 추가
              </button>
            </div>
          )}

          {rows.map((r, i) => {
            const err = fieldErrors[r.key] || {};
            const many = rows.length > 1;
            return (
              <div
                key={r.key}
                className={cx(many ? "flex flex-col gap-3 rounded-[12px] border border-(--ems-line) p-4" : "flex flex-col gap-4")}
              >
                {many && (
                  <div className={cx("flex items-center justify-between")}>
                    <span className={cx("flex h-6 w-6 items-center justify-center rounded-full bg-(--ems-bg) text-[11px] font-bold text-(--ems-muted)")}>
                      {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeRow(r.key)}
                      className={cx("text-xs font-semibold text-rose-600")}
                    >
                      빼기
                    </button>
                  </div>
                )}

                <label className={cx("session-modal-field")}>
                  <span>세션명 *</span>
                  <input
                    id={`ss-${r.key}-title`}
                    placeholder="예: 클라우드 아키텍처의 현재"
                    value={r.title}
                    onChange={(e) => changeRow(r.key, 'title', e.target.value)}
                  />
                  {err.title && <em>{err.title}</em>}
                </label>

                {/* 날짜 + 시 + 분(5분 단위). 행사 시작~종료 밖은 고를 수 없음 */}
                <div className={cx("session-modal-grid")}>
                  <label className={cx("session-modal-field")}>
                    <span>시작 일시 *</span>
                    <DateTimeField
                      id={`ss-${r.key}-start`}
                      compact
                      value={r.startsAt}
                      min={eventStart}
                      max={eventEnd}
                      isBlocked={startBlocked(r.key)}
                      hideBlocked // 고를 수 없는 시·분(행사 밖·다른 세션 중)은 목록에서 아예 빼기
                      onChange={(v) =>
                        setRows((list) =>
                          list.map((row) =>
                            row.key === r.key
                              ? { ...row, startsAt: v, endsAt: '' }
                              : row
                          )
                        )
                      }
                    />
                    {err.startsAt && <em>{err.startsAt}</em>}
                  </label>
                  <label className={cx("session-modal-field")}>
                    <span>종료 일시 *</span>
                    <DateTimeField
                      key={`${r.key}-${r.startsAt}`}
                      id={`ss-${r.key}-end`}
                      compact
                      value={r.endsAt}
                      min={r.startsAt || eventStart}
                      max={eventEnd}
                      // 다른 세션과 겹치는 시각 + 세션 시작과 "같은" 시각(종료 > 시작)을 함께 막음
                      isBlocked={endBlocked(r.key, r.startsAt)}
                      hideBlocked // 고를 수 없는 시·분은 목록에서 아예 빼기
                      onChange={(v) => changeRow(r.key, 'endsAt', v)}
                    />
                    {err.endsAt && <em>{err.endsAt}</em>}
                  </label>
                </div>
              </div>
            );
          })}

          {serverError && (
            <p className={cx("session-modal-error")}>
              {serverError.message} <span>({serverError.code})</span>
            </p>
          )}

          {others.length > 0 && (
            <p className={cx("session-modal-hint")}>
              이미 있는 세션(선택 불가):{' '}
              {others.map((s) => `${s.title} : ${formatTimeRange(s.startsAt, s.endsAt)}`).join(' · ')}
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
            {saving ? '저장 중…' : isEdit ? '변경사항 저장' : rows.length > 1 ? `세션 ${rows.length}개 등록` : '세션 등록'}
          </button>
        </div>
      </form>
    </div>
  );
}
