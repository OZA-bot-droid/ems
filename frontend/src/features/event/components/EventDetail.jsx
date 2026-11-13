// 04 · 행사 상세 화면
// 흐름: 화면이 뜨면 → 행사 정보 + 세션 목록을 "동시에" 요청(Promise.all) → 둘 다 오면 그리기
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventApi } from '../api/eventApi.js';
import { registrationApi } from '../api/registrationApi.js';
import { useAuth } from '../../member/hooks/useAuth.js';
import { formatRange, formatTimeRange, instantToKstInput, STATUS_BADGE } from '../utils/format.js';
import RegistrationApplyModal from './RegistrationApplyModal.jsx';
import LoginRequiredModal from './LoginRequiredModal.jsx';

// 참가 승인 화면 주소 (이도형 님 AdminApprovalPage). 내 행사들의 대기 신청을 승인·거절하는 화면
// 지금 승인 화면은 행사별로 거르지 않으므로 eventId는 넘기지 않음 (행사별 필터가 생기면 ?eventId=${id} 추가)
const APPROVAL_HREF = () => '/admin/approvals';

export default function EventDetail({ eventId, onBack }) {
  const { role, memberId } = useAuth();
  // navigate: 페이지를 통째로 새로고침하지 않아서 로그인 상태가 유지되고 더 빠름
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyError, setApplyError] = useState('');
  const isAdmin = role === 'ADMIN';
  const isLoggedIn = Boolean(role); // 로그인하지 않으면 role이 없음 (EventDiscoveryPage도 같은 기준)
  const [showLoginModal, setShowLoginModal] = useState(false); // 비로그인이 [참가 신청하기]를 눌렀을 때 뜨는 확인 창
  const [summary, setSummary] = useState(null); // 관리자: 신청 현황 (실패하면 그냥 안 보여줌)

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

    // 관리자면 신청 현황(승인 대기 몇 명인지)도 같이 가져옴 — 실패해도 상세 화면은 그대로
    if (isAdmin) {
      registrationApi
        .summary(eventId)
        .then((data) => !ignore && setSummary(data))
        .catch(() => !ignore && setSummary(null));
    }

    return () => {
      ignore = true;
    };
  }, [eventId, isAdmin]);

  async function applyToEvent() {
    setApplying(true);
    setApplyError('');
    try {
      await registrationApi.apply(eventId);
      setShowApplyModal(false);
      setApplyMessage('참가 신청이 완료되었습니다. 신청 내역에서 상태를 확인할 수 있어요.');
    } catch (applyError) {
      setApplyError(applyError.message || '참가 신청에 실패했습니다.');
    } finally {
      setApplying(false);
    }
  }

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
  // 참여 링크는 행사를 만든 관리자에게만 옴 → 내 행사가 아니면 "없음"이 아니라 "승인 후 제공"
  const isOwner = String(event.createdBy) === String(memberId);
  // 여러 날에 걸친 행사면 세션에 날짜도 같이 표시
  const multiDay = instantToKstInput(event.startsAt).slice(0, 10) !== instantToKstInput(event.endsAt).slice(0, 10);

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
                ) : isOwner ? (
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
                      <span className={`${multiDay ? 'w-44' : 'w-28'} shrink-0 font-semibold text-(--ems-green) tabular-nums`}>
                        {multiDay ? formatRange(s.startsAt, s.endsAt) : formatTimeRange(s.startsAt, s.endsAt)}
                      </span>
                      <span className="min-w-0">{s.title}</span>
                    </InfoRow>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* 관리자: [세션 관리] [참가 승인] / 그 외: [참가 신청하기] (비로그인은 누르면 로그인 안내 창) */}
          {isAdmin && isOwner ? (
            <div className="flex flex-col items-end gap-2">
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  disabled={!isOwner}
                  title={isOwner ? '이 행사의 세션을 추가·수정합니다' : '내가 만든 행사만 관리할 수 있습니다'}
                  onClick={() => navigate(`/admin/sessions?eventId=${event.id}`)}
                  className="h-[42px] min-w-[150px] rounded-[10px] border border-(--ems-green) bg-(--ems-surface) px-4 text-[13px] font-semibold text-(--ems-green) hover:bg-(--ems-green-soft) disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 disabled:hover:bg-(--ems-surface)"
                >
                  세션 관리
                </button>
                <button
                  disabled={!isOwner}
                  title={isOwner ? '신청자를 승인·거절합니다' : '내가 만든 행사만 관리할 수 있습니다'}
                  onClick={() => navigate(APPROVAL_HREF(event.id))}
                  className="h-[42px] min-w-[150px] rounded-[10px] bg-(--ems-green) px-4 text-[13px] font-semibold text-white hover:bg-(--ems-green-dark) disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  참가 승인{summary ? ` · 대기 ${summary.pending}명` : ''}
                </button>
              </div>
              {summary && (
                <p className="text-right text-[12px] text-(--ems-muted) tabular-nums">
                  승인 {summary.approved} · 거절 {summary.rejected} · 취소 {summary.cancelled}
                </p>
              )}
            </div>
          ) : (
          <div className="flex flex-col items-end gap-2">
            {applyMessage && (
              <p className="text-right text-[13px] text-(--ems-muted)" role="status">
                {applyMessage}
              </p>
            )}
          {!(isAdmin && !isOwner) && (
            <button
              disabled={!canApply || applying}
              onClick={() => {
                if (!isLoggedIn) return setShowLoginModal(true); // 비로그인: 신청 창 대신 로그인 안내
                setApplyError('');
                setShowApplyModal(true);
              }}
              className="h-[42px] min-w-[197px] rounded-[10px] bg-(--ems-green) px-4 text-[13px] font-semibold text-white hover:bg-(--ems-green-dark) disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {canApply ? '참가 신청하기' : event.status === 'CLOSED' ? '신청이 마감되었습니다' : '아직 모집 전입니다'}
            </button>
          )}
          </div>
          )}
        </div>
      </article>

      {showLoginModal && (
        <LoginRequiredModal
          onClose={() => setShowLoginModal(false)}
          onConfirm={() => window.location.assign('/login')}
        />
      )}

      {!isAdmin && showApplyModal && (
        <RegistrationApplyModal
          event={event}
          applying={applying}
          error={applyError}
          onClose={() => {
            if (!applying) setShowApplyModal(false);
          }}
          onSubmit={applyToEvent}
        />
      )}
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
