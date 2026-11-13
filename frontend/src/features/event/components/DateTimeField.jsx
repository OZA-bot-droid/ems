import { mapClassNames } from '../../../styles/classNames.js';
import module0 from '../styles/session-manage.module.scss';
import module1 from '../styles/event-manage.module.scss';
const cx = value => mapClassNames(value, module0, module1);
// 날짜 + 시 + 분을 따로 고르는 입력칸 (분은 5분 단위)
// 바깥(부모)과는 지금처럼 "2026-11-03T14:05" 한 줄 문자열로 주고받습니다.
// → 검사(validate)와 서버 변환(kstToInstant)은 그대로 쓸 수 있습니다.
// min / max (예: "2026-12-10T13:00")를 주면 그 범위 밖의 날짜·시·분은 고를 수 없게(회색) 막습니다.
// isBlocked("2026-12-10T14:05") → true 를 돌려주는 시각도 막습니다 (예: 이미 다른 세션이 있는 시간대)
import { useState } from 'react';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')); // 00 ~ 23
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0')); // 00, 05 ~ 55

const boxClass =
  'h-[43px] rounded-[9px] border border-transparent bg-(--ems-bg) px-3 text-[13px] text-(--ems-ink) focus:border-(--ems-green) focus:outline-none';

// compact: 칸이 좁을 때(모달에서 시작·종료를 나란히 둘 때) 시·분 선택을 좁게
// hideBlocked: 고를 수 없는 시·분을 회색으로 두지 않고 목록에서 아예 빼기 (지금 고른 값은 남겨 둠)
export default function DateTimeField({ id, value, onChange, minDate, maxDate, min, max, compact = false, isBlocked, hideBlocked = false }) {
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
  // 범위: 날짜는 달력 min/max로, 시·분은 그 날짜가 범위의 첫날/마지막 날일 때만 잘라냄
  const lowDate = minDate ?? min?.slice(0, 10);
  const highDate = maxDate ?? max?.slice(0, 10);
  // 한 시각(날짜·시·분)을 고를 수 없는가: 범위 밖이거나 isBlocked가 막는 시각
  const timeBlocked = (hour, m) => {
    const v = `${parts.date}T${hour}:${m}`; // 같은 모양의 문자열이라 크기 비교가 곧 시간 비교
    return Boolean((min && v < min) || (max && v > max) || isBlocked?.(v));
  };
  const hourBlocked = (h) =>
    Boolean(parts.date) &&
    ((min && parts.date === min.slice(0, 10) && h < min.slice(11, 13)) ||
      (max && parts.date === max.slice(0, 10) && h > max.slice(11, 13)) ||
      (isBlocked && MINUTES.every((m) => timeBlocked(h, m)))); // 그 시간의 모든 분이 막히면 시도 막음
  const minuteBlocked = (m) => {
    if (!parts.date || !parts.hour) return false;
    return timeBlocked(parts.hour, m);
  };

  const selectWidth = compact ? 'w-[72px] shrink-0 pl-2 pr-0.5' : 'w-[88px]';

  const allMinutes =
    parts.minute && !MINUTES.includes(parts.minute) ? [...MINUTES, parts.minute].sort() : MINUTES;

  // hideBlocked면 못 고르는 것은 목록에서 제거. 단, 지금 고른 값은 빈칸으로 보이지 않게 남긴다
  const hourOptions = hideBlocked ? HOURS.filter((h) => h === parts.hour || !hourBlocked(h)) : HOURS;
  const minuteOptions = hideBlocked
    ? allMinutes.filter((m) => m === parts.minute || !minuteBlocked(m))
    : allMinutes;

  return (
    <div className={cx("flex gap-2")}>
      <input
        id={id}
        type="date"
        min={lowDate}
        max={highDate}
        className={cx(`${boxClass} min-w-0 flex-1`)}
        value={parts.date}
        onChange={(e) => update('date', e.target.value)}
      />
      <select
        id={`${id}-hour`}
        aria-label="시"
        className={cx(`${boxClass} ${selectWidth}`)}
        value={parts.hour}
        onChange={(e) => update('hour', e.target.value)}
      >
        <option value="">시</option>
        {hourOptions.map((h) => (
          <option key={h} value={h} disabled={hourBlocked(h)}>
            {h}시
          </option>
        ))}
      </select>
      <select
        id={`${id}-minute`}
        aria-label="분"
        className={cx(`${boxClass} ${selectWidth}`)}
        value={parts.minute}
        onChange={(e) => update('minute', e.target.value)}
      >
        <option value="">분</option>
        {minuteOptions.map((m) => (
          <option key={m} value={m} disabled={minuteBlocked(m)}>
            {m}분
          </option>
        ))}
      </select>
    </div>
  );
}
