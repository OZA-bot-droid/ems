// 서버는 시간을 UTC(예: 2026-10-28T05:00:00Z)로 줍니다.
// 화면에는 한국 시간(KST, UTC+9)으로 바꿔서 보여 줍니다.
const KST = 'Asia/Seoul';

function parts(iso) {
  const p = new Intl.DateTimeFormat('ko-KR', {
    timeZone: KST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso));
  return Object.fromEntries(p.map((x) => [x.type, x.value]));
}

// "10.28 · 14:00"
export function formatShort(iso) {
  const t = parts(iso);
  return `${t.month}.${t.day} · ${t.hour}:${t.minute}`;
}

// "2026.10.28 14:00 – 17:00" (같은 날이면 끝은 시간만)
export function formatRange(startIso, endIso) {
  const s = parts(startIso);
  const e = parts(endIso);
  const start = `${s.year}.${s.month}.${s.day} ${s.hour}:${s.minute}`;
  const sameDay = s.year === e.year && s.month === e.month && s.day === e.day;
  const end = sameDay ? `${e.hour}:${e.minute}` : `${e.year}.${e.month}.${e.day} ${e.hour}:${e.minute}`;
  return `${start} – ${end}`;
}

// 백엔드 상태값 → 화면 배지 (이름은 팀 합의 후 바꿀 수 있음)
export const STATUS_BADGE = {
  DRAFT: { label: '작성 중', className: 'bg-slate-100 text-slate-600' },
  OPEN: { label: '모집 중', className: 'bg-emerald-100 text-emerald-700' },
  CLOSED: { label: '마감', className: 'bg-rose-100 text-rose-700' },
};

// "14:00 – 14:45" (세션처럼 같은 날 안의 시간만 보여줄 때)
export function formatTimeRange(startIso, endIso) {
  const s = parts(startIso);
  const e = parts(endIso);
  return `${s.hour}:${s.minute} – ${e.hour}:${e.minute}`;
}
