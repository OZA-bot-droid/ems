// 세션 관리의 "행사 선택" 드롭다운
// 브라우저 기본 <select>는 항목을 글자로만 그릴 수 있어서, 상태 배지·제목·시작 일시를 서로 다른 모양으로
// 보여 주려고 직접 만든 선택 상자입니다. (키보드: ↑↓ 이동, Enter 선택, Esc 닫기)
import { useEffect, useRef, useState } from 'react';
import { formatShort, STATUS_BADGE } from '../../format.js';

function EventLine({ event }) {
  const badge = STATUS_BADGE[event.status] ?? { label: event.status };
  return (
    <>
      <span className={`session-manage-status is-${event.status.toLowerCase()}`}>{badge.label}</span>
      <span className="event-picker-title">{event.title}</span>
      <span className="event-picker-date">{formatShort(event.startsAt)}</span>
    </>
  );
}

export default function EventPicker({ id, events, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0); // 키보드로 가리키고 있는 항목 위치
  const boxRef = useRef(null);
  const listRef = useRef(null);
  const selected = events.find((e) => e.id === value);

  // 바깥을 누르면 닫기
  useEffect(() => {
    if (!open) return;
    const close = (e) => !boxRef.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  // 열 때 지금 선택된 항목을 가리키고, 목록에 포커스
  useEffect(() => {
    if (!open) return;
    setActive(Math.max(0, events.findIndex((e) => e.id === value)));
    listRef.current?.focus();
  }, [open, events, value]);

  // 가리키는 항목이 보이도록 스크롤
  useEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  function choose(event) {
    onChange(event.id);
    setOpen(false);
    boxRef.current?.querySelector('button')?.focus();
  }

  function onListKey(e) {
    if (e.key === 'ArrowDown') setActive((i) => Math.min(i + 1, events.length - 1));
    else if (e.key === 'ArrowUp') setActive((i) => Math.max(i - 1, 0));
    else if (e.key === 'Enter' || e.key === ' ') choose(events[active]);
    else if (e.key === 'Escape' || e.key === 'Tab') setOpen(false);
    else return;
    e.preventDefault();
  }

  return (
    <div className={`event-picker${open ? ' is-open' : ''}`} ref={boxRef}>
      <button
        id={id}
        type="button"
        className="event-picker-button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        {selected ? <EventLine event={selected} /> : <span className="event-picker-title">행사를 선택하세요</span>}
        <span className="event-picker-arrow" aria-hidden="true" />
      </button>

      {open && (
        <ul
          className="event-picker-list"
          role="listbox"
          tabIndex={-1}
          ref={listRef}
          aria-labelledby={id}
          aria-activedescendant={`${id}-opt-${events[active]?.id}`}
          onKeyDown={onListKey}
        >
          {events.map((event, i) => (
            <li
              key={event.id}
              id={`${id}-opt-${event.id}`}
              role="option"
              aria-selected={event.id === value}
              className={`event-picker-option${i === active ? ' is-active' : ''}${event.id === value ? ' is-selected' : ''}`}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(event)}
            >
              <EventLine event={event} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
