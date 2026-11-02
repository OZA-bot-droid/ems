// 10 · 세션 관리 (그 행사를 만든 관리자 전용, Figma "10 세션 관리")
// 흐름: 행사 정보 + 세션 목록 불러오기 → [+ 세션 추가]/[수정]은 모달 → 저장·삭제하면 다시 불러오기
// eventId만 받으면 동작하므로, 나중에 라우터 주소(/admin/events/:eventId/sessions)에 그대로 붙일 수 있다
import { useEffect, useState } from 'react';
import { eventApi } from '../api.js';
import { formatRange, STATUS_BADGE } from '../format.js';
import SessionFormModal from './SessionFormModal.jsx';

export default function SessionManage({ eventId, onBack }) {
  const [event, setEvent] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0); // 숫자가 바뀌면 다시 불러옴
  const [modal, setModal] = useState(null); // null=닫힘, {}=새 세션, {session}=수정
  const [confirmId, setConfirmId] = useState(null); // 삭제 확인 중인 세션 번호
  const [notice, setNotice] = useState(null); // { type: 'ok' | 'error', text }

  // 행사 정보와 세션 목록을 동시에 요청
  useEffect(() => {
    let alive = true;
    setError(null);
    Promise.all([eventApi.get(eventId), eventApi.sessions(eventId)])
      .then(([ev, list]) => {
        if (!alive) return;
        setEvent(ev);
        setSessions(list);
      })
      .catch((err) => alive && setError(err));
    return () => {
      alive = false;
    };
  }, [eventId, reload]);

  const refresh = (text) => {
    setNotice({ type: 'ok', text });
    setReload((n) => n + 1);
  };

  async function remove(session) {
    try {
      await eventApi.removeSession(eventId, session.id);
      setConfirmId(null);
      refresh(`"${session.title}" 세션을 삭제했습니다.`);
    } catch (err) {
      setConfirmId(null);
      setNotice({ type: 'error', text: `${err.message} (${err.code})` });
    }
  }

  // 불러오기 실패 (예: 404 남의 DRAFT·없는 행사)
  if (error) {
    return (
      <section>
        <BackButton onBack={onBack} />
        <p className="rounded-[14px] bg-(--ems-surface) py-10 text-center text-sm text-rose-600">
          {error.status === 404 ? '행사를 찾을 수 없습니다.' : `세션 정보를 불러오지 못했습니다. (${error.code})`}
        </p>
      </section>
    );
  }
  if (!event) {
    return <p className="py-10 text-center text-sm text-(--ems-muted)">불러오는 중…</p>;
  }

  const badge = STATUS_BADGE[event.status] ?? { label: event.status, className: 'bg-slate-100' };
  // 마감된 행사는 보기만 (서버도 EVENT_CLOSED 409로 막음)
  const locked = event.status === 'CLOSED';

  return (
    <section>
      <BackButton onBack={onBack} />

      {/* 머리 */}
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold">{locked ? '세션 보기' : '세션 관리'}</h1>
          <p className="mt-1 text-[13px] text-(--ems-muted)">
            {locked ? '마감된 행사라 세션을 볼 수만 있습니다.' : '행사 시간 안에서 겹치지 않게 세션을 구성합니다.'}
          </p>
        </div>
        {!locked && (
        <button
          onClick={() => setModal({})}
          className="h-[43px] rounded-[9px] bg-(--ems-green) px-5 text-[13px] font-semibold text-white hover:bg-(--ems-green-dark)"
        >
          + 세션 추가
        </button>
        )}
      </header>

      {/* 어떤 행사의 세션인지 */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[14px] bg-(--ems-green-soft) px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-bold">{event.title}</p>
          <p className="mt-0.5 text-xs text-(--ems-muted)">행사 시간 · {formatRange(event.startsAt, event.endsAt)}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge.className}`}>{badge.label}</span>
      </div>

      {notice && (
        <p
          className={`mb-4 flex justify-between rounded-[8px] px-4 py-2.5 text-xs font-semibold ${
            notice.type === 'ok' ? 'bg-(--ems-green-soft) text-(--ems-green)' : 'bg-rose-50 text-rose-700'
          }`}
        >
          {notice.text}
          <button onClick={() => setNotice(null)} aria-label="알림 닫기">×</button>
        </p>
      )}

      {/* 세션 목록 */}
      <div className="rounded-[14px] bg-(--ems-surface) p-6">
        <h2 className="mb-4 text-[19px] font-bold">세션 목록 · {sessions.length}개</h2>

        {sessions.length === 0 && (
          <p className="py-8 text-center text-sm text-(--ems-muted)">
            {locked ? '등록된 세션이 없습니다.' : '아직 세션이 없습니다. [+ 세션 추가]로 시작하세요.'}
          </p>
        )}

        <ul className="flex flex-col gap-2">
          {sessions.map((session, i) => (
            <li key={session.id} className="flex min-h-[52px] flex-wrap items-center gap-3 rounded-[9px] bg-(--ems-row) px-4 py-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-(--ems-surface) text-xs font-bold text-(--ems-muted)">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{session.title}</p>
                <p className="text-xs text-(--ems-muted)">{formatRange(session.startsAt, session.endsAt)}</p>
              </div>

              {locked ? null : confirmId === session.id ? (
                // 삭제 확인 (줄 안에서 한 번 더 묻기)
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-rose-600">정말 삭제할까요?</span>
                  <button onClick={() => remove(session)} className="rounded-[6px] bg-rose-600 px-2.5 py-1 font-semibold text-white">삭제</button>
                  <button onClick={() => setConfirmId(null)} className="rounded-[6px] bg-(--ems-surface) px-2.5 py-1 font-semibold">취소</button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <button onClick={() => setModal({ session })} className="rounded-[6px] bg-(--ems-surface) px-2.5 py-1">수정</button>
                  <button onClick={() => setConfirmId(session.id)} className="rounded-[6px] px-2.5 py-1 text-rose-600">삭제</button>
                </div>
              )}
            </li>
          ))}
        </ul>

        <p className="mt-5 text-[11px] text-(--ems-muted)">세션은 행사 시간 안에서만 · 다른 세션과 겹침 불가 (끝나는 시각에 바로 시작은 가능)</p>
      </div>

      {modal && (
        <SessionFormModal
          event={event}
          session={modal.session}
          onClose={() => setModal(null)}
          onSaved={(saved) => {
            setModal(null);
            refresh(modal.session ? `"${saved.title}" 세션을 수정했습니다.` : `"${saved.title}" 세션을 추가했습니다.`);
          }}
        />
      )}
    </section>
  );
}

function BackButton({ onBack }) {
  return (
    <button onClick={onBack} className="mb-4 text-[13px] font-semibold text-(--ems-muted) hover:text-(--ems-ink)">
      ← 행사 관리로
    </button>
  );
}
