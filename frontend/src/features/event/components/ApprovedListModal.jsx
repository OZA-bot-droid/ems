// 행사 관리 · 참가 승인 명단 보기 (읽기 전용)
// 승인·거절 처리는 [참가 승인] 화면(AdminApprovalPage)에서 하고, 여기서는 "이 행사에 누가 승인됐는지"만 보여 줍니다.
// 서버 API는 이도형 님의 registrationApi를 그대로 씀:
//   - summary(eventId)            → 상태별 인원 (대기·승인·거절·취소)
//   - adminList({status:'APPROVED'}) → 내 행사들의 승인 신청 목록 → 이 행사(eventId)만 골라 냄
import { useEffect, useState } from 'react';
import { registrationApi } from '../api/registrationApi.js';
import { formatShort } from '../utils/format.js';

const PAGE_SIZE = 100; // 서버가 한 번에 주는 최대 개수
const MAX_PAGES = 10; // 안전장치: 최대 1,000건까지만 불러옴

// 승인 목록을 마지막 쪽까지 이어서 불러온 뒤, 이 행사 것만 남김
async function loadApproved(eventId) {
  const rows = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const data = await registrationApi.adminList({ status: 'APPROVED', page, size: PAGE_SIZE });
    rows.push(...(data?.content ?? []));
    if (!data || data.last || page + 1 >= (data.totalPages ?? 0)) break;
  }
  return rows
    .filter((r) => r.eventId === eventId)
    .sort((a, b) => String(a.decidedAt ?? '').localeCompare(String(b.decidedAt ?? ''))); // 승인된 순서대로
}

export default function ApprovedListModal({ event, onClose }) {
  const [list, setList] = useState(null); // null = 불러오는 중
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    Promise.all([loadApproved(event.id), registrationApi.summary(event.id).catch(() => null)])
      .then(([rows, counts]) => {
        if (!alive) return;
        setList(rows);
        setSummary(counts);
      })
      .catch((err) => alive && setError(err));
    return () => {
      alive = false;
    };
  }, [event.id]);

  return (
    // 어두운 배경 (바깥을 누르면 닫힘)
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(20,34,56,0.45)] px-4 py-10"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`${event.title} 참가 승인 명단`}
        onClick={(e) => e.stopPropagation()} // 안쪽 클릭은 닫히지 않게
        className="w-full max-w-[560px] rounded-[18px] bg-(--ems-surface) px-[30px] pt-6 pb-5"
      >
        {/* 머리 */}
        <div className="flex items-start justify-between gap-4 border-b border-(--ems-line) pb-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-[21px] font-bold text-(--ems-ink)">참가 승인 명단</h2>
            <p className="text-xs text-(--ems-muted)">{event.title}</p>
          </div>
          <button type="button" onClick={onClose} className="text-[23px] leading-none text-(--ems-muted)" aria-label="닫기">
            ×
          </button>
        </div>

        {/* 인원 요약: 승인 / 정원 (+ 대기·거절·취소) */}
        <div className="flex flex-wrap items-center gap-2 py-4 text-xs font-semibold">
          <span className="rounded-full bg-(--ems-green-soft) px-3 py-1 text-(--ems-green)">
            승인 {list ? list.length : '…'}명 / 정원 {event.capacity}명
          </span>
          {summary && (
            <span className="text-(--ems-muted)">
              대기 {summary.pending} · 거절 {summary.rejected} · 취소 {summary.cancelled}
            </span>
          )}
        </div>

        {/* 본문 */}
        {error ? (
          <p className="rounded-[8px] bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700" role="alert">
            {error.message} <span className="text-rose-400">({error.code})</span>
          </p>
        ) : list === null ? (
          <p className="py-6 text-center text-xs text-(--ems-muted)" role="status">명단을 불러오는 중입니다…</p>
        ) : list.length === 0 ? (
          <p className="py-6 text-center text-xs text-(--ems-muted)">아직 승인된 참가자가 없습니다.</p>
        ) : (
          <ol className="flex max-h-[360px] flex-col gap-2 overflow-y-auto">
            {list.map((r, i) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-[10px] bg-(--ems-bg) px-4 py-2.5 text-[13px] text-(--ems-ink)"
              >
                <span>
                  <span className="mr-3 text-(--ems-muted)">{i + 1}</span>
                  {r.applicantName?.trim() || '이름 정보가 없습니다.'}
                </span>
                <span className="text-xs text-(--ems-muted)">
                  신청 {formatShort(r.requestedAt)} · 승인 {r.decidedAt ? formatShort(r.decidedAt) : '-'}
                </span>
              </li>
            ))}
          </ol>
        )}

        <p className="mt-4 text-[11px] text-(--ems-muted)">
          승인·거절은 사이드바의 [참가 승인] 화면에서 할 수 있습니다. 회원 이름은 회원 서비스와 연동 후 표시 예정입니다.
        </p>

        <div className="mt-4 flex border-t border-(--ems-line) pt-4">
          <button
            type="button"
            onClick={onClose}
            className="h-[43px] flex-1 rounded-[9px] bg-(--ems-bg) text-[13px] font-semibold text-(--ems-ink)"
          >
            닫기
          </button>
        </div>
      </section>
    </div>
  );
}
