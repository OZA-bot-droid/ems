import { panel, field, btn } from './pollManageStyles.js';

export default function PollCreateForm({
  form,
  setForm,
  update,
  events,
  sessions,
  busy,
  onSubmit,
}) {
  return (
    <form className={panel + ' space-y-3'} onSubmit={onSubmit}>
      <h2 className="font-bold">투표 생성</h2>
      {/* 행사 변경 시 이전 세션 선택을 초기화하여 잘못된 조합 방지 */}
      <div className="grid gap-3 md:grid-cols-2">
        <label>
          행사
          <select
            required
            className={field}
            value={form.eventId}
            onChange={(e) => setForm((s) => ({ ...s, eventId: e.target.value, sessionId: '' }))}
          >
            <option value="">행사 선택</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          세션
          <select
            required
            className={field}
            value={form.sessionId}
            onChange={(e) => update('sessionId', e.target.value)}
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
      <label className="block">
        질문
        <input
          required
          maxLength={255}
          className={field}
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
        />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label>
          시작
          <input
            className={field}
            required
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => update('startsAt', e.target.value)}
          />
        </label>
        <label>
          종료
          <input
            className={field}
            required
            type="datetime-local"
            value={form.endsAt}
            onChange={(e) => update('endsAt', e.target.value)}
          />
        </label>
      </div>
      {/* 선택지는 최소 2개 유지하며 각 항목을 추가·수정·삭제 가능 */}
      <h3 className="font-semibold">선택지</h3>
      {form.options.map((o, i) => (
        <div key={i} className="flex gap-2">
          <input
            required
            maxLength={255}
            className={field}
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
            disabled={form.options.length <= 2}
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
      <button type="button" onClick={() => update('options', [...form.options, ''])}>
        ＋ 선택지
      </button>
      {/* showLiveResults: 투표 진행 중 결과 공개 여부 */}
      <label className="flex gap-2">
        <input
          type="checkbox"
          checked={form.showLiveResults}
          onChange={(e) => update('showLiveResults', e.target.checked)}
        />
        실시간 결과 공개
      </label>
      <button disabled={busy} type="submit" className={btn}>
        투표 생성
      </button>
    </form>
  );
}
