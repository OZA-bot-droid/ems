import styles from '../../styles/PollResult.module.scss';

/** 기존 VotePage와 동일한 방식으로 득표수/득표율 막대를 표시한다. */
export default function PollResultChart({ results, myOptionId }) {
  const totalVotes = Number(results?.totalVotes ?? 0);
  const options = Array.isArray(results?.options) ? results.options : [];

  // 전체 선택지 중 최대 득표수 계산
  const maxVotes = Math.max(0, ...options.map((option) => Number(option.voteCount ?? 0)));

  return (
    <section className="space-y-3">
      <h2 className="font-bold">선택지별 결과</h2>

      {options.length === 0 && <p className="text-sm text-slate-500">표시할 선택지가 없습니다.</p>}

      {/* 선택지별 결과 */}
      {options.map((option) => {
        // 선택지 득표수
        const count = Number(option.voteCount ?? 0);

        // 전체 투표수 대비 득표율 계산
        const percent = totalVotes > 0 ? Math.round((count * 100) / totalVotes) : 0;

        // 최다 득표 여부 (동률이면 모두 true)
        const isWinner = totalVotes > 0 && count === maxVotes;

        // 현재 로그인 사용자가 투표한 선택지인지 확인
        const isMyVote = myOptionId != null && String(option.pollOptionId) === String(myOptionId);

        return (
          <div
            key={option.pollOptionId}
            className={`${styles.resultOption} ${isWinner ? styles.winnerOption : ''}`}
          >
            <div className={styles.resultInfo}>
              {/* 왼쪽: 선택지 이름 및 본인 투표 표시 */}
              <span className={styles.resultLabel}>
                {option.content}

                {/* 일반 사용자가 선택한 항목에만 표시 */}
                {isMyVote && <span className={styles.myVoteBadge}>✓ 내 선택</span>}
              </span>

              {/* 오른쪽: 득표수 및 득표율 */}
              <span className={styles.resultCount}>
                {count}표 · {percent}%
              </span>
            </div>

            {/* 득표율 막대 */}
            <div className={styles.resultBar}>
              <div className={styles.resultBarFill} style={{ width: `${percent}%` }} />
            </div>
          </div>
        );
      })}
    </section>
  );
}
