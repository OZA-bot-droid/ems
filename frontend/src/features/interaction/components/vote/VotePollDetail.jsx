import { panel, action } from './voteStyles.js';
import VoteResults from './VoteResults.jsx';

/** 선택한 투표의 선택지, 제출 버튼, 결과 조회 버튼과 결과 영역. */
export default function VotePollDetail({
  poll,
  submitted,
  optionId,
  setOptionId,
  busy,
  canViewResults,
  submit,
  showResults,
  results,
}) {
  return (
    <section className={panel}>
      {!poll && <p>왼쪽에서 투표를 선택하세요.</p>}
      {poll && (
        <>
          <h2 className="text-xl font-bold">{poll.title}</h2>
          <p className="mb-4 text-sm text-slate-500">
            {poll.status} · {new Date(poll.endsAt).toLocaleString('ko-KR')} 종료
          </p>
          {/* 제출한 투표이거나 요청 처리 중이면 선택지 입력을 비활성화한다. */}
          <fieldset disabled={!!submitted || busy} className="space-y-2">
            {(poll.options || []).map((option) => (
              <label key={option.id} className="flex gap-3 rounded-lg border p-3">
                <input
                  name="poll-option"
                  type="radio"
                  checked={String(optionId || submitted) === String(option.id)}
                  onChange={() => setOptionId(option.id)}
                />
                {option.content}
              </label>
            ))}
          </fieldset>
          {/* 투표 제출 및 결과 확인: busy/기존 제출/결과 공개 정책으로 버튼을 제어한다. */}
          <div className="mt-4 flex flex-wrap gap-3">
            <button className={action} disabled={busy || !!submitted || !optionId} onClick={submit}>
              {submitted ? '투표 완료' : '투표 제출'}
            </button>
            <button
              className="rounded-lg border px-4 py-2 disabled:opacity-40"
              onClick={showResults}
              disabled={busy || !canViewResults}
            >
              결과 확인
            </button>
          </div>
          {!canViewResults && (
            <p className="mt-3 text-sm text-slate-500">투표 종료 후 결과를 확인할 수 있습니다.</p>
          )}
          {/* 결과 데이터가 있을 때 선택지별 득표수와 백분율 막대를 표시한다. */}
          <VoteResults results={results} />
        </>
      )}
    </section>
  );
}
