import PollResultChart from './PollResultChart.jsx';

/** 결과 조회 API 응답을 출력한다. DTO 이외의 필드(질문, 상태 등)는 임의로 가정하지 않는다. */
export default function PollResultDetail({ results, loading, error }) {
  if (loading)
    return (
      <section className="rounded-xl border bg-white p-5 shadow-sm">투표 결과 조회 중...</section>
    );
  if (error)
    return (
      <p className="rounded-lg bg-red-50 p-3 text-red-700" role="alert">
        {error}
      </p>
    );
  if (!results) return <p>조회된 결과가 없습니다.</p>;

  return (
    <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold">전체 투표 수</h2>
        <p className="text-2xl font-bold">{results.totalVotes ?? 0}표</p>
      </div>
      <PollResultChart results={results} />
    </section>
  );
}
