import styles from '../../styles/Vote.module.scss';

/** 참여 가능 투표 목록 및 선택 UI. */
export default function VotePollList({ polls, selectedId, setSelectedId }) {
  return (
    <aside className={styles.listCard}>
      <h2 className={styles.listHeader}>투표 목록 ({polls.length})</h2>

      {/* 투표 항목이 많으면 목록 내부에서 스크롤한다. */}
      <div className={styles.pollList}>
        {/* 투표 목록 버튼: 클릭 시 selectedId를 바꿔 상세 조회 대상을 전환한다. */}
        {polls.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={String(p.id) === String(selectedId)}
            className={`${styles.pollItem} ${
              String(p.id) === String(selectedId) ? styles.selectedPoll : ''
            }`}
            onClick={() => setSelectedId(p.id)}
          >
            <strong className={styles.pollTitle}>{p.title}</strong>
          </button>
        ))}

        {polls.length === 0 && <p className={styles.emptyMessage}>참여 가능한 투표가 없습니다.</p>}
      </div>
    </aside>
  );
}
