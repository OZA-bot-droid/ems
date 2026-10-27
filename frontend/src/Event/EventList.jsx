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
    <section className="flex flex-col gap-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[27px] font-bold text-(--ems-ink)">행사 목록</h1>
          <p className="text-[13px] text-(--ems-muted)">이벤트 탐색 · 검색 및 필터</p>
        </div>
      </header>

      {/* 검색 + 상태 필터 */}
      <div className="flex flex-wrap gap-4">
        <input
          id="event-search"
          className="h-[45px] min-w-0 flex-1 rounded-[10px] border border-transparent bg-(--ems-surface) px-4 text-sm text-(--ems-ink) placeholder:text-(--ems-muted) focus:border-(--ems-green) focus:outline-none sm:max-w-[525px]"
          placeholder="⌕ 행사명, 키워드로 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <select
          id="event-status"
          className="h-[45px] rounded-[10px] border border-transparent bg-(--ems-surface) px-4 text-[13px] font-semibold text-(--ems-ink) focus:border-(--ems-green) focus:outline-none"
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
      {loading && <p className="text-sm text-(--ems-muted)">행사를 불러오는 중입니다…</p>}

      {!loading && error && (
        <div className="rounded-[14px] bg-rose-50 p-5 text-sm text-rose-700">
          <p className="font-semibold">행사 목록을 불러오지 못했습니다.</p>
          <p className="mt-1">
            {error.message} <span className="text-rose-400">({error.code})</span>
          </p>
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="rounded-[14px] bg-(--ems-surface) p-10 text-center text-sm text-(--ems-muted)">
          {keyword ? '검색어와 맞는 행사가 없습니다.' : '아직 등록된 행사가 없습니다.'}
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <ul className="grid gap-[18px] md:grid-cols-2">
          {events.map((event, index) => (
            <li key={event.id}>
              <EventCard event={event} index={index} onClick={() => onSelect?.(event.id)} />
            </li>
          ))}
        </ul>
      )}

      {/* 페이지 이동 */}
      {result && result.totalPages > 1 && (
        <nav className="flex items-center justify-center gap-3 text-sm text-(--ems-ink)">
          <button
            className="rounded-[10px] bg-(--ems-surface) px-4 py-2 font-semibold disabled:opacity-40"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            이전
          </button>
          <span className="tabular-nums text-(--ems-muted)">
            {page + 1} / {result.totalPages}
          </span>
          <button
            className="rounded-[10px] bg-(--ems-surface) px-4 py-2 font-semibold disabled:opacity-40"
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

// 카드 한 장 (부품) — Figma 03 · Event card
function EventCard({ event, index, onClick }) {
  const badge = STATUS_BADGE[event.status] ?? { label: event.status, className: 'bg-slate-100' };
  // Figma처럼 카드 그림 영역 색을 초록/파랑 번갈아
  const visual = index % 2 === 0 ? 'bg-(--ems-green-soft)' : 'bg-(--ems-blue-soft)';
  return (
    <button
      onClick={onClick}
      className="flex h-full w-full flex-col gap-4 rounded-[14px] bg-(--ems-surface) p-3 text-left transition hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(20,34,56,0.08)] focus-visible:outline-2 focus-visible:outline-(--ems-green)"
    >
      <div className={`flex h-[72px] items-center rounded-[9px] px-4 ${visual}`}>
        <span className="text-sm font-bold text-(--ems-green)">EMS EVENT</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 px-2 pb-2">
        <h2 className="text-[17px] font-bold leading-snug text-(--ems-ink)">{event.title}</h2>
        <p className="text-[13px] text-(--ems-muted) tabular-nums">
          {formatShort(event.startsAt)} · 정원 {event.capacity}명
        </p>
        <span
          className={`mt-2 w-fit rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>
    </button>
  );
}
