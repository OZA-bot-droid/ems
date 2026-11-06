// 파일 기능: 선택지별 득표수와 결과를 표시합니다.

import styles from './PollResults.module.scss';

// 함수 역할: 투표 결과 및 득표율을 화면에 표시합니다.
export default function PollResults({
  totals,
  totalVotes,
  submittedOption,
  loading,
  error,
  onRefresh,
  onBack,
}) {
  // 전체 투표 수
  const sum = totalVotes;

  // 가장 많은 득표수
  const highestCount = Math.max(0, ...totals.map((option) => option.count));

  // 로딩 화면
  if (loading) {
    return (
      <div className={styles.results}>
        <p role="status">투표 결과를 불러오는 중입니다.</p>
      </div>
    );
  }

  // 오류 화면
  if (error) {
    return (
      <div className={styles.results}>
        <p role="alert">{error}</p>

        <button type="button" className={styles.outline} onClick={onRefresh}>
          다시 시도
        </button>

        <button type="button" className={styles.outline} onClick={onBack}>
          ← 투표 화면으로
        </button>
      </div>
    );
  }

  return (
    <div className={styles.results} aria-label="투표 결과">
      <div className={styles.resultTitle}>
        <strong>투표 결과</strong>
        <span>전체 {sum}표 · 서버 DB 집계</span>
      </div>

      {totals.map((option) => {
        const percent = sum ? Math.round((option.count / sum) * 100) : 0;

        const isTopResult = highestCount > 0 && option.count === highestCount;

        const isMyVote = submittedOption != null && option.id === submittedOption;

        return (
          <div className={styles.result} key={option.id}>
            <div className={`${styles.resultLabel} ${isTopResult ? styles.topResult : ''}`}>
              <span className={styles.optionName}>
                {option.content}

                {isMyVote && <span className={styles.myVote}>✓ 내 투표</span>}
              </span>

              <strong>
                {percent}% ({option.count}표)
              </strong>
            </div>

            <div
              className={styles.track}
              role="progressbar"
              aria-label={option.content}
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={`${styles.fill} ${isTopResult ? styles.topFill : ''}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}

      <button type="button" className={styles.outline} onClick={onRefresh}>
        결과 새로고침
      </button>

      <button type="button" className={styles.outline} onClick={onBack}>
        ← 투표 화면으로
      </button>
    </div>
  );
}
