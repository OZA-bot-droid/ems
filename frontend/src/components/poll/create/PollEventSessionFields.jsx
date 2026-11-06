// 파일 기능: 투표에 연결할 행사·세션 선택 필드를 렌더링합니다.

//==========데모 데이터=============
import { DEMO_EVENTS } from '../../../data/demoEventSessions.js';
import styles from './CreatePollModal.module.scss';
// 함수 역할: 행사와 세션 선택 필드를 표시합니다.
export default function PollEventSessionFields({ form, event, selectEvent, update }) {
  return (
    <div className={styles.twoColumns}>
      <label className={styles.field}>
        행사 *
        <select required value={form.eventId} onChange={(e) => selectEvent(e.target.value)}>
          <option value="">행사를 선택하세요</option>
          {DEMO_EVENTS.map((item) => (
            <option value={item.id} key={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.field}>
        세션 *
        <select
          required
          value={form.sessionId}
          disabled={!event}
          onChange={(e) => update('sessionId', e.target.value)}
        >
          <option value="">세션을 선택하세요</option>
          {event?.sessions.map((item) => (
            <option value={item.id} key={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
