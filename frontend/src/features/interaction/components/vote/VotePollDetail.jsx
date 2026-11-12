import styles from '../../styles/Vote.module.scss';
import VoteResults from './VoteResults.jsx';

/** 선택한 투표의 선택지, 제출 버튼, 결과 조회 버튼과 결과 영역. */
export default function VotePollDetail({
  poll,
  submitted,
  optionId,
  setOptionId,
  busy,
  canViewResults,
  submit,
  showResults,
  results,
}) {
  return (
    <section className={styles.detailCard}>
      {!poll && <p className={styles.emptyMessage}>왼쪽에서 투표를 선택하세요.</p>}

      {poll && (
        <>
          <h2 className={styles.detailTitle}>{poll.title}</h2>
          <p className={styles.detailInfo}>{new Date(poll.endsAt).toLocaleString('ko-KR')} 종료</p>
          <p className={styles.detailInfo}>
            {canViewResults ? '투표 결과 조회 가능' : '투표 결과 조회 불가능'}
          </p>

          {/* 제출한 투표이거나 요청 처리 중이면 선택지 입력을 비활성화한다. */}
          <fieldset disabled={submitted != null || busy} className={styles.optionList}>
            {(poll.options || []).map((option) => (
              <label key={option.id} className={styles.optionItem}>
                <input
                  name="poll-option"
                  type="radio"
                  checked={String(optionId ?? submitted ?? '') === String(option.id)}
                  onChange={() => setOptionId(option.id)}
                />

                {option.content}
              </label>
            ))}
          </fieldset>

          {/* 투표 제출 및 결과 확인: busy/기존 제출/결과 공개 정책으로 버튼을 제어한다. */}
          <div className={styles.actionGroup}>
            <button
              type="button"
              className={styles.submitButton}
              disabled={busy || submitted != null || !optionId}
              onClick={submit}
            >
              {submitted != null ? '투표 완료' : '투표 제출'}
            </button>

            <button
              type="button"
              className={styles.resultButton}
              onClick={showResults}
              disabled={busy || !canViewResults}
            >
              결과 확인
            </button>
          </div>

          {!canViewResults && (
            <p className={styles.detailInfo}>투표 종료 후 결과를 확인할 수 있습니다.</p>
          )}

          {/* 결과 데이터가 있을 때 선택지별 득표수와 백분율 막대를 표시한다. */}
          <VoteResults results={results} submitted={submitted} />
        </>
      )}
    </section>
  );
}
