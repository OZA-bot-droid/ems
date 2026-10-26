// 03 · 행사 목록 화면
// 흐름: 화면이 뜨면 → eventApi.list() 로 목록 요청 → 받은 content 를 카드로 그리기
import { useEffect, useState } from 'react';
import { eventApi, getDevUser } from '../api.js';
import { formatShort, STATUS_BADGE } from '../format.js';

const PAGE_SIZE = 8;

export default function EventList({ onSelect }) {
  const isAdmin = getDevUser().role === 'ADMIN';

  // 화면이 기억하는 값들 (바뀌면 화면이 다시 그려짐)
  const [status, setStatus] = useState(''); // '' = 전체
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [result, setResult] = useState(null); // 서버가 준 PageResponse
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // status 나 page 가 바뀔 때마다 서버에 다시 요청
  useEffect(() => {
    let ignore = false; // 이전 요청의 늦은 응답은 무시
    setLoading(true);
    setError(null);
    eventApi
      .list({ status, page, size: PAGE_SIZE })
      .then((data) => !ignore && setResult(data))
      .catch((e) => !ignore && setError(e))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [status, page]);

  // 검색어는 지금 받은 페이지 안에서만 거릅니다 (서버 검색 API는 아직 없음)
  const events = (result?.content ?? []).filter((e) =>
    e.title.toLowerCase().includes(keyword.trim().toLowerCase()),
  );

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-semibold tracking-wide text-indigo-600">03 · 행사 목록</p>
        <h1 className="text-2xl font-bold">이벤트 탐색</h1>
      </header>

      {/* 검색 + 상태 필터 */}
      <div className="flex flex-wrap gap-3">
        <input
          id="event-search"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm"
          placeholder="⌕ 행사명으로 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <select
          id="event-status"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(0); // 필터가 바뀌면 첫 페이지부터
          }}
        >
          <option value="">전체 행사</option>
          <option value="OPEN">모집 중</option>
          <option value="CLOSED">마감</option>
          {isAdmin && <option value="DRAFT">작성 중 (관리자)</option>}
        </select>
      </div>

      {/* 상황별 화면: 불러오는 중 / 에러 / 비어 있음 / 목록 */}
      {loading && <p className="text-sm text-slate-500">행사를 불러오는 중입니다…</p>}

      {!loading && error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p className="font-semibold">행사 목록을 불러오지 못했습니다.</p>
          <p className="mt-1">
            {error.message} <span className="text-rose-400">({error.code})</span>
          </p>
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          {keyword ? '검색어와 맞는 행사가 없습니다.' : '아직 등록된 행사가 없습니다.'}
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {events.map((event) => (
            <li key={event.id}>
              <EventCard event={event} onClick={() => onSelect?.(event.id)} />
            </li>
          ))}
        </ul>
      )}

      {/* 페이지 이동 */}
      {result && result.totalPages > 1 && (
        <nav className="flex items-center justify-center gap-3 text-sm">
          <button
            className="rounded border px-3 py-1 disabled:opacity-40"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            이전
          </button>
          <span className="tabular-nums">
            {page + 1} / {result.totalPages}
          </span>
          <button
            className="rounded border px-3 py-1 disabled:opacity-40"
            disabled={page + 1 >= result.totalPages}
            onClick={() => setPage(page + 1)}
          >
            다음
          </button>
        </nav>
      )}
    </section>
  );
}

// 카드 한 장 (부품)
function EventCard({ event, onClick }) {
  const badge = STATUS_BADGE[event.status] ?? { label: event.status, className: 'bg-slate-100' };
  return (
    <button
      onClick={onClick}
      className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-indigo-500"
    >
      <div className="flex h-24 items-end bg-gradient-to-br from-indigo-500 to-sky-400 p-3">
        <span className="text-[11px] font-semibold tracking-widest text-white/80">EMS EVENT</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className={`w-fit rounded-full px-2 py-0.5 text-xs font-semibold ${badge.className}`}>
          {badge.label}
        </span>
        <h2 className="font-semibold leading-snug">{event.title}</h2>
        <p className="mt-auto text-sm text-slate-500 tabular-nums">
          {formatShort(event.startsAt)} · 정원 {event.capacity}명
        </p>
      </div>
    </button>
  );
}
