// 파일 기능: 시작·종료 시각과 결과 공개 설정을 렌더링합니다.

import styles from './CreatePollModal.module.scss';
// 함수 역할: 투표 일정 입력 필드를 표시합니다.
export default function PollScheduleFields({ form, update }) {
  return (
    <>
      <div className={styles.twoColumns}>
        <label className={styles.field}>
          시작 일시 *
          <input
            required
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => update('startsAt', e.target.value)}
          />
        </label>
        <label className={styles.field}>
          종료 일시 *
          <input
            required
            type="datetime-local"
            value={form.endsAt}
            onChange={(e) => update('endsAt', e.target.value)}
          />
        </label>
      </div>
      <label className={styles.checkbox}>
        <input
          type="checkbox"
          checked={form.showLiveResults}
          onChange={(e) => update('showLiveResults', e.target.checked)}
        />
        투표 중 실시간 결과 공개
      </label>
    </>
  );
}
