import { panel } from './voteStyles.js';

/** 참여 가능 투표 목록 및 선택 UI. */
export default function VotePollList({ polls, selectedId, setSelectedId }) {
  return (
    <aside className={panel}>
      <h2 className="mb-3 font-semibold">투표 목록 ({polls.length})</h2>
      {/* 투표 목록 버튼: 클릭 시 selectedId를 바꿔 상세 조회 대상을 전환한다. */}
      {polls.map((p) => (
        <button
          key={p.id}
          aria-pressed={String(p.id) === String(selectedId)}
          className={
            'mb-2 w-full rounded-lg border p-3 text-left ' +
            (String(p.id) === String(selectedId)
              ? 'border-emerald-500 bg-emerald-50'
              : 'border-slate-200')
          }
          onClick={() => setSelectedId(p.id)}
        >
          <strong>{p.title}</strong>
          <p className="text-xs text-slate-500">
            행사 {p.eventId} / 세션 {p.sessionId}
          </p>
        </button>
      ))}
      {polls.length === 0 && <p>참여 가능한 투표가 없습니다.</p>}
    </aside>
  );
}
