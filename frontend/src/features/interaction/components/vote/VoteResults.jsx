/** 서버에서 조회한 선택지별 득표수와 비율 막대를 출력한다. */
export default function VoteResults({ results }) {
  // 원본에서는 results 값이 존재할 때만 결과 UI를 표시했다.
  if (!results) return null;

  return (
    <section className="mt-5 space-y-3">
      <h3 className="font-bold">투표 결과 ({results.totalVotes ?? 0}표)</h3>
      {(results.options || []).map((option) => {
        // count: 현재 선택지가 획득한 표 수(누락 시 0).
        const count = option.voteCount ?? 0;
        // percent: 전체 투표수 대비 득표 비율을 정수 퍼센트로 계산한다.
        const percent = results.totalVotes > 0 ? Math.round((count * 100) / results.totalVotes) : 0;
        return (
          <div key={option.pollOptionId}>
            <div className="flex justify-between text-sm">
              <span>{option.content}</span>
              <span>
                {count}표 · {percent}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-600"
                style={{ width: percent + '%' }}
              />
            </div>
          </div>
        );
      })}
    </section>
  );
}
