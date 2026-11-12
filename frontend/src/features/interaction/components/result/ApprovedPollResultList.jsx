import { Link } from 'react-router-dom';
import styles from '../../styles/PollList.module.scss';

/**
 * 일반 사용자 목록 UI.
 * 목록 데이터는 PollListPage -> useApprovedPolls -> pollApi.userPolls에서 전달된다.
 * UserPollDTO에 showLiveResults 속성이 있다는 가정 없이 결과 확인 버튼을 표시한다.
 * 결과 공개 여부·참가 권한은 pollApi.results()의 백엔드에서 최종 판정한다.
 */
export default function ApprovedPollResultList({ polls, loading, error, reload }) {
  return (
    <section className={styles.listCard}>
      <div className={styles.listHeader}>
        <h2 className={styles.listTitle}>투표 목록</h2>

        <button type="button" className={styles.refreshButton} onClick={reload} disabled={loading}>
          목록 새로고침
        </button>
      </div>

      {loading && <p className={styles.emptyMessage}>투표 목록 불러오는 중...</p>}

      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}

      {!loading && !error && polls.length === 0 && (
        <p className={styles.emptyMessage}>조회 가능한 투표가 없습니다.</p>
      )}

      {polls.map((poll) => (
        <div key={poll.id} className={styles.pollItem}>
          <div>
            <p className={styles.pollTitle}>{poll.title ?? `투표 ${poll.id}`}</p>

            <p className={styles.pollInfo}>
              {poll.eventId != null ? `행사 ${poll.eventId}` : ''}
              {poll.sessionId != null ? ` / 세션 ${poll.sessionId}` : ''}
            </p>
          </div>

          {poll.canViewResults ? (
            <Link
              className={styles.resultButton}
              to={`/polls/${poll.id}/results`}
              state={{ from: '/polls/user' }}
            >
              결과 확인
            </Link>
          ) : (
            <button type="button" disabled className={styles.disabledButton}>
              결과 확인
            </button>
          )}
        </div>
      ))}
    </section>
  );
}
