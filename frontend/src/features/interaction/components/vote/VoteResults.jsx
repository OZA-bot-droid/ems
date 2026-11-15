import styles from '../../styles/Vote.module.scss';

/** 서버에서 조회한 선택지별 득표수와 비율 막대를 출력한다. */
export default function VoteResults({ results, submitted }) {
  // 원본에서는 results 값이 존재할 때만 결과 UI를 표시했다.
  if (!results) return null;

  const options = results.options || [];
  const totalVotes = results.totalVotes ?? 0;

  // 가장 많은 득표수를 구한다.
  const maxVotes = Math.max(0, ...options.map((option) => option.voteCount ?? 0));

  return (
    <section className="mt-5 space-y-3">
      <h3 className="font-bold">투표 결과 ({totalVotes}표)</h3>

      {options.map((option) => {
        const count = option.voteCount ?? 0;

        const percent = totalVotes > 0 ? Math.round((count * 100) / totalVotes) : 0;

        // 본인이 투표한 선택지인지 확인
        const isMyVote = submitted != null && String(option.pollOptionId) === String(submitted);

        // 최다 득표 선택지인지 확인
        const isWinner = totalVotes > 0 && count === maxVotes;

        return (
          <div
            key={option.pollOptionId}
            className={`${styles.resultOption} ${isWinner ? styles.winnerOption : ''}`}
          >
            <div className={styles.resultInfo}>
              <span className={styles.resultLabel}>
                {option.content}
                {isMyVote && <span className={styles.myVoteBadge}>✓ 내 선택</span>}
              </span>

              <span className={styles.resultCount}>
                {count}표 · {percent}%
              </span>
            </div>

            <div className={styles.resultBar}>
              <div className={styles.resultBarFill} style={{ width: `${percent}%` }} />
            </div>
          </div>
        );
      })}
    </section>
  );
}
