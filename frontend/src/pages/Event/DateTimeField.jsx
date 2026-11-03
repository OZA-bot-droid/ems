// 날짜 + 시 + 분을 따로 고르는 입력칸 (분은 5분 단위)
// 바깥(부모)과는 지금처럼 "2026-11-03T14:05" 한 줄 문자열로 주고받습니다.
// → 검사(validate)와 서버 변환(kstToInstant)은 그대로 쓸 수 있습니다.
import { useState } from 'react';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')); // 00 ~ 23
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0')); // 00, 05 ~ 55

const boxClass =
  'h-[43px] rounded-[9px] border border-transparent bg-(--ems-bg) px-3 text-[13px] text-(--ems-ink) focus:border-(--ems-green) focus:outline-none';

export default function DateTimeField({ id, value, onChange, minDate }) {
  // 처음 값 "2026-11-03T14:05" → 날짜 / 시 / 분 세 조각으로 나눠서 기억
  const [parts, setParts] = useState(() => {
    const [date = '', time = ''] = (value || '').split('T');
    const [hour = '', minute = ''] = time.split(':');
    return { date, hour, minute };
  });

  // 한 조각이 바뀌면: 세 조각이 다 있을 때만 완성된 값을, 아니면 빈 값을 부모에게 알림
  function update(name, next) {
    const merged = { ...parts, [name]: next };
    setParts(merged);
    const complete = merged.date && merged.hour && merged.minute;
    onChange(complete ? `${merged.date}T${merged.hour}:${merged.minute}` : '');
  }

  // 예전에 5분 단위가 아닌 값(예: 14:07)으로 저장된 행사를 수정할 때도 원래 값이 보이도록
  const minuteOptions =
    parts.minute && !MINUTES.includes(parts.minute) ? [...MINUTES, parts.minute].sort() : MINUTES;

  return (
    <div className="flex gap-2">
      <input
        id={id}
        type="date"
        min={minDate}
        className={`${boxClass} min-w-0 flex-1`}
        value={parts.date}
        onChange={(e) => update('date', e.target.value)}
      />
      <select
        id={`${id}-hour`}
        aria-label="시"
        className={`${boxClass} w-[88px]`}
        value={parts.hour}
        onChange={(e) => update('hour', e.target.value)}
      >
        <option value="">시</option>
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}시
          </option>
        ))}
      </select>
      <select
        id={`${id}-minute`}
        aria-label="분"
        className={`${boxClass} w-[88px]`}
        value={parts.minute}
        onChange={(e) => update('minute', e.target.value)}
      >
        <option value="">분</option>
        {minuteOptions.map((m) => (
          <option key={m} value={m}>
            {m}분
          </option>
        ))}
      </select>
    </div>
  );
}
