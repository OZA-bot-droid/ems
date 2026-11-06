// 파일 기능: 참여 가능한 투표 목록을 표시합니다.

import styles from './PollList.module.scss';

// 로그인한 사용자가 참여 중인 세션의 ACTIVE 투표만 서버에서 조회됩니다.
export default function PollList({ polls, selectedPollId, onSelect }) {
  return (
    <aside className={styles.panel} aria-label="투표 목록">
      <div className={styles.heading}>
        <h2>투표 목록</h2>
        <span>{polls.length}개</span>
      </div>
      <div className={styles.items}>
        {polls.map((poll) => (
          <button
            type="button"
            key={poll.id}
            onClick={() => onSelect(poll.id)}
            aria-pressed={selectedPollId === poll.id}
            className={`${styles.item} ${selectedPollId === poll.id ? styles.active : ''}`}
          >
            <span className={styles.eventName}>{poll.eventName}</span>
            <strong className={styles.title}>{poll.title}</strong>
            <span className={styles.meta}>
              <span className={`${styles.status} ${styles.active}`}>진행 중</span>
            </span>
          </button>
        ))}
      </div>
      <p className={styles.helper}>현재 참여 가능한 투표 목록입니다.</p>
    </aside>
  );
}
