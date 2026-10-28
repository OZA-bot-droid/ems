// 09 · 행사 관리 (관리자 전용, Figma "09 행사 관리")
// 흐름: 목록 불러오기 → [+ 행사 등록]/[수정]은 모달 열기 → 저장되면 목록 다시 불러오기
import { useEffect, useState } from 'react';
import { eventApi, getDevUser } from '../api.js';
import { formatShort, STATUS_BADGE } from '../format.js';
import EventFormModal from './EventFormModal.jsx';

// 상태별로 누를 수 있는 다음 단계 (DRAFT → OPEN → CLOSED, 되돌리기 없음)
const NEXT_STATUS = {
  DRAFT: { to: 'OPEN', label: '공개' },
  OPEN: { to: 'CLOSED', label: '마감' },
};

export default function EventManage() {
  const [page, setPage] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0); // 숫자가 바뀌면 목록을 다시 불러옴
  const [modal, setModal] = useState(null); // null=닫힘, {}=새 행사, {event}=수정
  const [confirm, setConfirm] = useState(null); // 확인 중인 것: { id, type: 'delete' | 'status' }
  const [notice, setNotice] = useState(null); // 위쪽 알림 한 줄

  useEffect(() => {
    let alive = true;
    setError(null);
    eventApi
      .list({ page, size: 10 })
      .then((data) => alive && setResult(data))
      .catch((err) => alive && setError(err));
    return () => {
      alive = false;
    };
  }, [page, reload]);

  const refresh = (message) => {
    setNotice(message);
    setReload((n) => n + 1);
  };

  async function changeStatus(event) {
    const next = NEXT_STATUS[event.status];
    try {
      await eventApi.update(event.id, { status: next.to });
      setConfirm(null);
      refresh(`"${event.title}" 행사를 ${next.label}했습니다.`);
    } catch (err) {
      setNotice(`${err.message} (${err.code})`);
    }
  }

  async function remove(event) {
    try {
      await eventApi.remove(event.id);
      setConfirm(null);
      refresh(`"${event.title}" 행사를 삭제했습니다.`);
    } catch (err) {
      setNotice(`${err.message} (${err.code})`);
    }
  }

  const events = result?.content ?? [];
  // 내가 만든 행사인지 (서버도 같은 규칙으로 403을 주지만, 화면에서 미리 버튼을 숨김)
  const myId = String(getDevUser().id);
  const isMine = (event) => String(event.createdBy) === myId;

  return (
    <section>
      {/* 머리 */}
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold">행사 관리</h1>
          <p className="mt-1 text-[13px] text-(--ems-muted)">관리자 · 행사 등록, 수정, 공개 상태 관리</p>
        </div>
        <button
          onClick={() => setModal({})}
          className="h-[43px] rounded-[9px] bg-(--ems-green) px-5 text-[13px] font-semibold text-white hover:bg-(--ems-green-dark)"
        >
          + 행사 등록
        </button>
      </header>

      {notice && (
        <p className="mb-4 flex justify-between rounded-[8px] bg-(--ems-green-soft) px-4 py-2.5 text-xs font-semibold text-(--ems-green)">
          {notice}
          <button onClick={() => setNotice(null)} aria-label="알림 닫기">×</button>
        </p>
      )}

      {/* 목록 카드 */}
      <div className="rounded-[14px] bg-(--ems-surface) p-6">
        <h2 className="mb-4 text-[19px] font-bold">행사 목록 · 운영</h2>

        {error && <p className="py-8 text-center text-sm text-rose-600">행사 목록을 불러오지 못했습니다. ({error.code})</p>}
        {!error && !result && <p className="py-8 text-center text-sm text-(--ems-muted)">불러오는 중…</p>}
        {result && events.length === 0 && (
          <p className="py-8 text-center text-sm text-(--ems-muted)">아직 등록된 행사가 없습니다. [+ 행사 등록]으로 시작하세요.</p>
        )}

        <ul className="flex flex-col gap-2">
          {events.map((event) => {
            const badge = STATUS_BADGE[event.status] ?? { label: event.status, className: 'bg-slate-100' };
            const next = NEXT_STATUS[event.status];
            return (
              <li key={event.id} className="flex min-h-[52px] flex-wrap items-center gap-3 rounded-[9px] bg-(--ems-row) px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{event.title}</p>
                  <p className="text-xs text-(--ems-muted)">
                    {formatShort(event.startsAt)} · 정원 {event.capacity}명
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge.className}`}>{badge.label}</span>

                {confirm?.id === event.id && confirm.type === 'status' ? (
                  // 상태 변경 확인: 되돌릴 수 없다는 경고 + 예/아니오
                  <div className="flex w-full items-center justify-between gap-2 rounded-[8px] bg-amber-50 px-3 py-2 text-xs sm:w-auto">
                    <span className="font-semibold text-amber-700">
                      ⚠ {next.label}하면 다시 되돌릴 수 없습니다. {next.label}할까요?
                    </span>
                    <span className="flex gap-2">
                      <button onClick={() => changeStatus(event)} className="rounded-[6px] bg-(--ems-green) px-3 py-1 font-semibold text-white">예</button>
                      <button onClick={() => setConfirm(null)} className="rounded-[6px] bg-(--ems-surface) px-3 py-1 font-semibold">아니오</button>
                    </span>
                  </div>
                ) : confirm?.id === event.id && confirm.type === 'delete' ? (
                  // 삭제 확인 (브라우저 confirm 창 대신 줄 안에서 한 번 더 묻기)
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-rose-600">정말 삭제할까요?</span>
                    <button onClick={() => remove(event)} className="rounded-[6px] bg-rose-600 px-2.5 py-1 font-semibold text-white">삭제</button>
                    <button onClick={() => setConfirm(null)} className="rounded-[6px] bg-(--ems-surface) px-2.5 py-1 font-semibold">취소</button>
                  </div>
                ) : !isMine(event) ? (
                  // 다른 관리자가 만든 행사: 보기만 가능
                  <span className="rounded-[6px] bg-(--ems-surface) px-2.5 py-1 text-xs text-(--ems-muted)">다른 관리자의 행사</span>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <button onClick={() => setModal({ event })} className="rounded-[6px] bg-(--ems-surface) px-2.5 py-1">수정</button>
                    {next && (
                      <button onClick={() => setConfirm({ id: event.id, type: 'status' })} className="rounded-[6px] bg-(--ems-green-soft) px-2.5 py-1 text-(--ems-green)">
                        {next.label}
                      </button>
                    )}
                    <button onClick={() => setConfirm({ id: event.id, type: 'delete' })} className="rounded-[6px] px-2.5 py-1 text-rose-600">삭제</button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {result && result.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3 text-sm">
            <button disabled={page === 0} onClick={() => setPage(page - 1)} className="disabled:opacity-40">이전</button>
            <span>{page + 1} / {result.totalPages}</span>
            <button disabled={page + 1 >= result.totalPages} onClick={() => setPage(page + 1)} className="disabled:opacity-40">다음</button>
          </div>
        )}

        <p className="mt-5 text-[11px] text-(--ems-muted)">행사 생성·수정 ADMIN 권한 검증 · 필수 필드 및 일정 유효성 검사</p>
      </div>

      {modal && (
        <EventFormModal
          event={modal.event}
          onClose={() => setModal(null)}
          onSaved={(saved) => {
            setModal(null);
            refresh(modal.event ? `"${saved.title}" 행사를 수정했습니다.` : `"${saved.title}" 행사를 등록했습니다. (작성 중)`);
          }}
        />
      )}
    </section>
  );
}
