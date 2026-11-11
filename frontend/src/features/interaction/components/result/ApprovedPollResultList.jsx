import { Link } from 'react-router-dom';

/**
 * 일반 사용자 목록 UI.
 * 목록 데이터는 PollListPage -> useApprovedPolls -> pollApi.userPolls에서 전달된다.
 * UserPollDTO에 showLiveResults 속성이 있다는 가정 없이 결과 확인 버튼을 표시한다.
 * 결과 공개 여부·참가 권한은 pollApi.results()의 백엔드에서 최종 판정한다.
 */
export default function ApprovedPollResultList({ polls, loading, error, reload }) {
  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">투표 목록 ({polls.length})</h2>
        <button
          type="button"
          className="rounded-lg border px-3 py-2 text-sm"
          onClick={reload}
          disabled={loading}
        >
          목록 새로고침
        </button>
      </div>

      {loading && <p>투표 목록 불러오는 중...</p>}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {!loading && !error && polls.length === 0 && <p>조회 가능한 투표가 없습니다.</p>}

      {polls.map((poll) => (
        <div
          key={poll.id}
          className="flex flex-wrap items-center justify-between gap-3 border-b py-3"
        >
          <div>
            <p className="font-semibold">{poll.title ?? `투표 ${poll.id}`}</p>
            <p className="text-xs text-slate-500">
              {poll.eventId != null ? `행사 ${poll.eventId}` : ''}
              {poll.sessionId != null ? ` / 세션 ${poll.sessionId}` : ''}
            </p>
          </div>
          {poll.canViewResults ? (
            <Link
              className="rounded-lg bg-emerald-700 px-3 py-2 text-sm text-white"
              to={`/polls/${encodeURIComponent(poll.id)}/results`}
              state={{ from: '/polls/user' }}
            >
              결과 확인
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-lg bg-gray-300 px-3 py-2 text-sm text-gray-500"
            >
              결과 확인
            </button>
          )}
        </div>
      ))}
    </section>
  );
}
