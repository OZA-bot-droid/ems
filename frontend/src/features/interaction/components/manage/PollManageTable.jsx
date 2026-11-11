import PollPagination from './PollPagination.jsx';
import { panel, btn } from './pollManageStyles.js';

// 관리자 Poll 목록, 상태 조작 버튼, 페이징을 표시하는 컴포넌트
export default function PollManageTable({
  eventFilter,
  sessionFilter,
  loading,
  rows,
  busy,
  page,
  pages,
  onPageChange,
  onChangeStatus,
}) {
  return (
    <section className={panel}>
      <h2 className="mb-4 font-bold">
        등록된 투표 {eventFilter && '(행사 ' + eventFilter + ')'}{' '}
        {sessionFilter && '(세션 ' + sessionFilter + ')'}
      </h2>
      {/* 로딩 → 빈 목록 → 투표 테이블 순으로 조건부 렌더링 */}
      {loading ? (
        <p>불러오는 중...</p>
      ) : rows.length === 0 ? (
        <p>표시할 투표가 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                {['투표', '행사 / 세션', '시작', '상태', '관리'].map((x) => (
                  <th key={x} className="border-b p-3">
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* p: 조회된 투표 한 건, canActivate/canClose는 API 응답의 버튼 활성화 여부 */}
              {rows.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="p-3 font-semibold">{p.title}</td>
                  <td className="p-3">
                    {p.eventId} / {p.sessionId}
                  </td>
                  <td className="p-3">{new Date(p.startsAt).toLocaleString('ko-KR')}</td>
                  <td className="p-3">{p.status}</td>
                  <td className="space-x-2 p-3">
                    <button
                      className={btn}
                      disabled={busy || !p.canActivate}
                      onClick={() => onChangeStatus(p.id, 'activate')}
                    >
                      활성화
                    </button>
                    <button
                      disabled={busy || !p.canClose}
                      onClick={() => onChangeStatus(p.id, 'close')}
                    >
                      종료
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <PollPagination page={page} pages={pages} onPageChange={onPageChange} />
    </section>
  );
}
