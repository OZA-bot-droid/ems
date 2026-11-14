import styles from '../../styles/PollManage.module.scss';
import { field, btn } from './pollManageStyles.js';
import DateTimeField from '../../../event/components/DateTimeField.jsx';

export default function PollCreateForm({
  form,
  setForm,
  update,
  events,
  sessions,
  busy,
  onSubmit,
  onCancel,
}) {
  function toLocalDateTime(value) {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const offset = date.getTimezoneOffset() * 60_000;

    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  // 현재 선택한 세션 정보
  const selectedSession = sessions.find((s) => String(s.id) === String(form.sessionId));

  // 세션 진행 시간 표시용
  function formatSessionDateTime(value) {
    if (!value) return '-';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '-';

    return date.toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  return (
    <form className={styles.createForm} onSubmit={onSubmit}>
      {/* 행사 변경 시 이전 세션 선택을 초기화하여 잘못된 조합 방지 */}
      <div className={styles.formGrid}>
        <label className={styles.formLabel}>
          <h3 className={styles.optionsTitle}>행사</h3>
          <select
            required
            className={`${styles.formField} ${styles.selectBox}`}
            value={form.eventId}
            onChange={(e) =>
              setForm((s) => ({
                ...s,
                eventId: e.target.value,
                sessionId: '',
                startsAt: '',
                endsAt: '',
              }))
            }
          >
            <option value="">행사 선택</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.formLabel}>
          <h3 className={styles.optionsTitle}>세션</h3>
          <select
            required
            className={styles.formField}
            value={form.sessionId}
            onChange={(e) => {
              const sessionId = e.target.value;

              const selectedSession = sessions.find((s) => String(s.id) === String(sessionId));

              setForm((prev) => ({
                ...prev,
                sessionId,
                startsAt: selectedSession ? toLocalDateTime(selectedSession.startsAt) : '',
                endsAt: selectedSession ? toLocalDateTime(selectedSession.endsAt) : '',
              }));
            }}
          >
            <option value="">세션 선택</option>
            {sessions.map((s) => (
              <option value={s.id} key={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* 선택한 세션의 진행 시간 */}
      {selectedSession && (
        <div className={styles.sessionTimeInfo}>
          <span className={styles.sessionTimeLabel}>세션 진행 시간</span>

          <span className={styles.sessionTimeValue}>
            {formatSessionDateTime(selectedSession.startsAt)}
            {' ~ '}
            {formatSessionDateTime(selectedSession.endsAt)}
          </span>
        </div>
      )}

      {/* 투표 질문 */}
      <label className={styles.formLabel}>
        <h3 className={styles.optionsTitle}>질문</h3>
        <input
          required
          maxLength={255}
          className={styles.formField}
          placeholder="투표 질문을 입력하세요."
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
        />
      </label>

      {/* 투표 시작 및 종료 일시 */}
      <div className={styles.formGrid}>
        <div className={`${styles.formLabel} ${styles.TimeField}`}>
          <label htmlFor="poll-starts-at" className={styles.optionsTitle}>
            시작
          </label>
          <DateTimeField
            key={`start-${form.sessionId}`}
            id="poll-starts-at"
            value={form.startsAt}
            onChange={(value) => update('startsAt', value)}
            compact
          />
        </div>

        <div className={`${styles.formLabel} ${styles.TimeField}`}>
          <label htmlFor="poll-ends-at" className={styles.optionsTitle}>
            종료
          </label>
          <DateTimeField
            key={`end-${form.sessionId}`}
            id="poll-ends-at"
            value={form.endsAt}
            onChange={(value) => update('endsAt', value)}
            compact
          />
        </div>
      </div>

      {/* 선택지는 최소 2개 유지하며 각 항목을 추가·수정·삭제 가능 */}
      <div className={styles.optionsSection}>
        <h3 className={styles.optionsTitle}>선택지</h3>

        {form.options.map((o, i) => (
          <div key={i} className={styles.optionRow}>
            <input
              required
              maxLength={255}
              className={styles.formField}
              placeholder={`선택지 ${i + 1}`}
              aria-label={`선택지 ${i + 1}`}
              value={o}
              onChange={(e) =>
                update(
                  'options',
                  form.options.map((s, j) => (j === i ? e.target.value : s)),
                )
              }
            />

            <button
              type="button"
              className={styles.optionDelete}
              disabled={busy || form.options.length <= 2}
              onClick={() =>
                update(
                  'options',
                  form.options.filter((_, j) => i !== j),
                )
              }
            >
              삭제
            </button>
          </div>
        ))}

        <button
          type="button"
          className={styles.optionAdd}
          disabled={busy}
          onClick={() => update('options', [...form.options, ''])}
        >
          ＋ 선택지 추가
        </button>
      </div>

      {/* showLiveResults: 투표 진행 중 결과 공개 여부 */}
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={form.showLiveResults}
          disabled={busy}
          onChange={(e) => update('showLiveResults', e.target.checked)}
        />
        실시간 결과 공개
      </label>

      {/* 모달 하단 버튼 */}
      <div className={styles.formActions}>
        <button type="button" className={styles.cancelButton} disabled={busy} onClick={onCancel}>
          취소
        </button>

        <button type="submit" className={styles.submitButton} disabled={busy}>
          {busy ? '생성 중...' : '투표 생성'}
        </button>
      </div>
    </form>
  );
}
