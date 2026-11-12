import { Link } from 'react-router-dom';

/** 진입 경로가 관리자 투표 관리인지 구분하되, 조회 권한은 서버가 최종 판단한다. */
export default function PollResultHeader({ from, pollId, onRefresh, loading }) {
  // 관리자 투표 관리 페이지에서 진입했는지 확인
  const fromManage = from === '/admin/polls';

  // 진입 경로에 따른 돌아가기 주소
  const backTo = fromManage ? '/admin/polls' : '/polls/user';

  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">투표 결과</h1>
        <p className="text-sm text-slate-500">
          투표 ID: {pollId} · {fromManage ? '관리자 관리 화면에서 진입' : '투표 목록에서 진입'}
        </p>
      </div>
      <div className="flex gap-2">
        <Link className="rounded-lg border px-4 py-2 text-sm" to={backTo}>
          돌아가기
        </Link>
        <button
          type="button"
          className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
          disabled={loading}
          onClick={onRefresh}
        >
          새로고침
        </button>
      </div>
    </header>
  );
}
