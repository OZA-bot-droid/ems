// 04 · 행사 상세 화면
// 흐름: 화면이 뜨면 → 행사 정보 + 세션 목록을 "동시에" 요청(Promise.all) → 둘 다 오면 그리기
import { useEffect, useState } from 'react';
import { eventApi, getDevUser } from '../api.js';
import { formatRange, formatTimeRange, STATUS_BADGE } from '../format.js';

export default function EventDetail({ eventId, onBack }) {
  const isAdmin = getDevUser().role === 'ADMIN';

  const [event, setEvent] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);

    // 요청 2개를 한꺼번에 보내고, 둘 다 끝날 때까지 기다림
    Promise.all([eventApi.get(eventId), eventApi.sessions(eventId)])
      .then(([eventData, sessionData]) => {
        if (ignore) return;
        setEvent(eventData);
        setSessions(sessionData);
      })
      .catch((e) => !ignore && setError(e)) // 둘 중 하나라도 실패하면 여기로
      .finally(() => !ignore && setLoading(false));

    return () => {
      ignore = true;
    };
  }, [eventId]);

  const backButton = (
    <button
      onClick={onBack}
      className="w-fit rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
    >
      ← 목록으로
    </button>
  );

  if (loading) {
    return (
      <section className="flex flex-col gap-4">
        {backButton}
        <p className="text-sm text-slate-500">행사 정보를 불러오는 중입니다…</p>
      </section>
    );
  }

  if (error) {
    // 404: 없는 행사이거나, 일반 사용자가 DRAFT 행사를 열었을 때 (백엔드 규칙)
    const notFound = error.status === 404;
    return (
      <section className="flex flex-col gap-4">
        {backButton}
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          <p className="font-semibold">
            {notFound ? '행사를 찾을 수 없습니다.' : '행사 정보를 불러오지 못했습니다.'}
          </p>
          <p className="mt-1">
            {notFound ? '삭제되었거나 아직 공개되지 않은 행사입니다.' : error.message}
            <span className="ml-1 text-rose-400">({error.code})</span>
          </p>
        </div>
      </section>
    );
  }

  const badge = STATUS_BADGE[event.status] ?? { label: event.status, className: 'bg-slate-100' };
  const canApply = event.status === 'OPEN';

  return (
    <section className="flex flex-col gap-6">
      {backButton}

      {/* 머리: 상태 배지 + 제목 */}
      <header className="flex flex-col gap-3 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-400 p-6 text-white">
        <p className="text-xs font-semibold tracking-widest text-white/80">EMS 2026 · EVENT</p>
        <h1 className="text-2xl font-bold">{event.title}</h1>
        <span className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>
          {badge.label}
        </span>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 왼쪽: 소개 + 세션 */}
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <article className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">행사 소개</h2>
            <p className="whitespace-pre-line text-slate-700">
              {event.description || '등록된 소개가 없습니다.'}
            </p>
          </article>

          <article className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">세션 일정</h2>
            {sessions.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                아직 등록된 세션이 없습니다.
              </p>
            ) : (
              <ol className="flex flex-col gap-2">
                {sessions.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3"
                  >
                    <span className="shrink-0 text-sm font-semibold text-indigo-600 tabular-nums">
                      {formatTimeRange(s.startsAt, s.endsAt)}
                    </span>
                    <span className="min-w-0">{s.title}</span>
                  </li>
                ))}
              </ol>
            )}
          </article>
        </div>

        {/* 오른쪽: 일정·정원·링크·신청 버튼 */}
        <aside className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5">
          <div>
            <p className="text-xs font-semibold text-slate-500">행사 일정</p>
            <p className="mt-1 font-medium tabular-nums">{formatRange(event.startsAt, event.endsAt)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">정원</p>
            {/* 현재 참가자 수는 이도형 님의 신청 API가 생기면 연결 */}
            <p className="mt-1 font-medium">{event.capacity}명</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">참여 링크</p>
            {event.meetingUrl ? (
              <a
                href={event.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block break-all text-sm text-indigo-600 underline"
              >
                {event.meetingUrl}
              </a>
            ) : (
              <p className="mt-1 text-sm text-slate-500">
                {isAdmin ? '등록된 링크가 없습니다.' : '참가 승인 후 제공됩니다.'}
              </p>
            )}
          </div>

          {/* 참가 신청: 이도형 님의 신청 모달과 연결할 자리 */}
          <button
            disabled={!canApply}
            onClick={() => alertApply(event)}
            className="mt-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {canApply ? '참가 신청하기' : event.status === 'CLOSED' ? '신청이 마감되었습니다' : '아직 모집 전입니다'}
          </button>
        </aside>
      </div>
    </section>
  );
}

// TODO(이도형 님과 연결): 신청 모달 열기. 지금은 콘솔에만 남김
function alertApply(event) {
  console.log('[참가 신청] eventId =', event.id);
}
