/** 기존 VotePage와 동일한 방식으로 득표수/득표율 막대를 표시한다. */
export default function PollResultChart({ results }) {
  const totalVotes = Number(results?.totalVotes ?? 0);
  const options = Array.isArray(results?.options) ? results.options : [];

  return (
    <section className="space-y-3">
      <h2 className="font-bold">선택지별 결과</h2>
      {options.length === 0 && <p className="text-sm text-slate-500">표시할 선택지가 없습니다.</p>}
      {options.map((option, index) => {
        const count = Number(option.voteCount ?? 0);
        const percent = totalVotes > 0 ? Math.round((count * 100) / totalVotes) : 0;
        return (
          <div key={option.pollOptionId ?? option.id ?? index}>
            <div className="flex justify-between text-sm">
              <span>{option.content}</span>
              <span>
                {count}표 · {percent}%
              </span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-600"
                style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
              />
            </div>
          </div>
        );
      })}
    </section>
  );
}
