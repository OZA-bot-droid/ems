// 03 · 행사 목록 화면
// 흐름: 화면이 뜨면 → eventApi.list() 로 목록 요청 → 받은 content 를 카드로 그리기
import { mapClassNames } from '../../../styles/classNames.js';
import style0 from '../styles/event-list.module.scss';
import style1 from '../styles/session-manage.module.scss'; // 선택 상자 공통 모양(.select-box)
const cx = (value) => mapClassNames(value, style0, style1);
import { useEffect, useState } from 'react';
import { eventApi } from '../api/eventApi.js';
import { formatShort, STATUS_BADGE } from '../utils/format.js';
import { useAuth } from '../../member/hooks/useAuth.js';

const PAGE_SIZE = 8;
// 정렬: 모집 중(OPEN) → 마감(CLOSED), 같은 상태 안에서는 시작일이 빠른 순
// status는 DB에 글자로 저장 → 내림차순이면 OPEN > DRAFT > CLOSED (관리자 본인의 작성 중 행사는 가운데)
const LIST_SORT = ['status,desc', 'startsAt,asc'];

export default function EventList({ onSelect }) {
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';

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
      .list({ status, page, size: PAGE_SIZE, sort: LIST_SORT })
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
    <section className={cx("event-list-page")} aria-label="행사 목록">
      {/* 화면 제목은 페이지(EventDiscoveryPage)가 그린다 — 행사 관리와 같은 방식 */}

      {/* 검색 + 상태 필터 */}
      <div className={cx("event-list-toolbar")}>
        <input
          id="event-search"
          className={cx("event-list-search")}
          placeholder="⌕ 행사명, 키워드로 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        {/* 세션 관리의 "행사 선택" 상자와 같은 모양 */}
        <select
          id="event-status"
          className={cx("select-box event-list-filter")}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(0); // 필터가 바뀌면 첫 페이지부터
          }}
        >
          <option value="">전체 행사</option>
          <option value="OPEN">모집 중</option>
          <option value="CLOSED">마감</option>
        </select>
      </div>

      {/* 상황별 화면: 불러오는 중 / 에러 / 비어 있음 / 목록 */}
      {loading && <p className={cx("event-list-feedback")}>행사를 불러오는 중입니다…</p>}

      {!loading && error && (
        <div className={cx("event-list-error")} role="alert">
          <p>
            <strong>행사 목록을 불러오지 못했습니다.</strong>
          </p>
          <p>
            {error.message} <span>({error.code})</span>
          </p>
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className={cx("event-list-empty")}>
          {keyword ? '검색어와 맞는 행사가 없습니다.' : '아직 등록된 행사가 없습니다.'}
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <ul className={cx("event-list-grid")}>
          {events.map((event, index) => (
            <li key={event.id}>
              <EventCard event={event} index={index} onClick={() => onSelect?.(event.id)} />
            </li>
          ))}
        </ul>
      )}

      {/* 페이지 이동 */}
      {result && result.totalPages > 1 && (
        <nav className={cx("event-list-pagination")} aria-label="페이지 이동">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            이전
          </button>
          <span>
            {page + 1} / {result.totalPages}
          </span>
          <button
            type="button"
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
  const badge = STATUS_BADGE[event.status] ?? { label: event.status };
  return (
    <button type="button" onClick={onClick} className={cx("event-list-card")}>
      {/* Figma처럼 카드 그림 영역 색을 초록·파랑 번갈아 */}
      <div className={cx(`event-list-visual${index % 2 === 0 ? '' : ' is-alt'}`)}>EMS EVENT</div>
      <div className={cx("event-list-body")}>
        <h2 className={cx("event-list-title")}>{event.title}</h2>
        <p className={cx("event-list-meta")}>
          {formatShort(event.startsAt)} · 정원 {event.capacity}명
        </p>
        <span className={cx(`event-list-status is-${event.status.toLowerCase()}`)}>{badge.label}</span>
      </div>
    </button>
  );
}
