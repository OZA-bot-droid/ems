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
      className="w-fit rounded-[10px] bg-(--ems-surface) px-4 py-2 text-[13px] font-semibold text-(--ems-ink) hover:text-(--ems-green)"
    >
      ← 목록으로
    </button>
  );

  if (loading) {
    return (
      <section className="flex flex-col gap-4">
        {backButton}
        <p className="text-sm text-(--ems-muted)">행사 정보를 불러오는 중입니다…</p>
      </section>
    );
  }

  if (error) {
    // 404: 없는 행사이거나, 일반 사용자가 DRAFT 행사를 열었을 때 (백엔드 규칙)
    const notFound = error.status === 404;
    return (
      <section className="flex flex-col gap-4">
        {backButton}
        <div className="rounded-[14px] bg-rose-50 p-6 text-sm text-rose-700">
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[27px] font-bold text-(--ems-ink)">행사 상세</h1>
          <p className="text-[13px] text-(--ems-muted)">일정 · 세션 · 참가 상태</p>
        </div>
        {backButton}
      </div>

      {/* Figma 04 · Event details: 흰 카드 하나 */}
      <article className="flex flex-col gap-8 rounded-[14px] bg-(--ems-surface) p-5">
        {/* 머리: Event hero */}
        <header className="flex flex-col gap-3 rounded-[12px] bg-(--ems-green-soft) px-6 py-6">
          <p className="text-sm font-bold text-(--ems-green)">EMS 2026 · EVENT</p>
          <h2 className="text-[26px] font-bold text-(--ems-ink)">{event.title}</h2>
          <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
            {badge.label}
          </span>
        </header>

        <div className="flex flex-col gap-8 px-1.5">
          {/* 행사 소개 */}
          <section className="flex flex-col gap-2">
            <h3 className="text-lg font-bold text-(--ems-ink)">행사 소개</h3>
            <p className="whitespace-pre-line text-sm text-(--ems-muted)">
              {event.description || '등록된 소개가 없습니다.'}
            </p>
          </section>

          {/* 행사 일정: 줄무늬 행 3개 */}
          <section className="flex flex-col gap-2">
            <h3 className="text-lg font-bold text-(--ems-ink)">행사 일정</h3>
            <div className="flex flex-col gap-[7px]">
              <InfoRow striped>
                <span className="tabular-nums">{formatRange(event.startsAt, event.endsAt)}</span>
              </InfoRow>
              <InfoRow>
                {event.meetingUrl ? (
                  <a
                    href={event.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-(--ems-green) underline"
                  >
                    온라인 · {event.meetingUrl}
                  </a>
                ) : isAdmin ? (
                  '등록된 참여 링크가 없습니다.'
                ) : (
                  '온라인 세미나 · 참여 URL은 승인 후 제공'
                )}
              </InfoRow>
              <InfoRow striped>
                {/* 현재 참가자 수는 이도형 님의 신청 API가 생기면 연결 */}
                정원 {event.capacity}명
              </InfoRow>
            </div>
          </section>

          {/* 세션 일정 (Figma에는 없지만 상세 화면의 세션 표시) */}
          <section className="flex flex-col gap-2">
            <h3 className="text-lg font-bold text-(--ems-ink)">세션 일정</h3>
            {sessions.length === 0 ? (
              <InfoRow striped>
                <span className="text-(--ems-muted)">아직 등록된 세션이 없습니다.</span>
              </InfoRow>
            ) : (
              <ol className="flex flex-col gap-[7px]">
                {sessions.map((s, i) => (
                  <li key={s.id}>
                    <InfoRow striped={i % 2 === 0}>
                      <span className="w-28 shrink-0 font-semibold text-(--ems-green) tabular-nums">
                        {formatTimeRange(s.startsAt, s.endsAt)}
                      </span>
                      <span className="min-w-0">{s.title}</span>
                    </InfoRow>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* 참가 신청: 이도형 님의 신청 모달과 연결할 자리 */}
          <div className="flex justify-end">
            <button
              disabled={!canApply}
              onClick={() => alertApply(event)}
              className="h-[42px] min-w-[197px] rounded-[10px] bg-(--ems-green) px-4 text-[13px] font-semibold text-white hover:bg-(--ems-green-dark) disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {canApply
                ? '참가 신청하기'
                : event.status === 'CLOSED'
                  ? '신청이 마감되었습니다'
                  : '아직 모집 전입니다'}
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}

// 행사 일정의 한 줄 (Figma Row 1·2·3: 줄무늬)
function InfoRow({ striped = false, children }) {
  return (
    <div
      className={`flex min-h-[52px] items-center gap-3 rounded-[9px] px-4 py-3 text-[13px] text-(--ems-ink) ${
        striped ? 'bg-(--ems-row)' : 'bg-(--ems-surface)'
      }`}
    >
      {children}
    </div>
  );
}

// TODO(이도형 님과 연결): 신청 모달 열기. 지금은 콘솔에만 남김
function alertApply(event) {
  console.log('[참가 신청] eventId =', event.id);
}
