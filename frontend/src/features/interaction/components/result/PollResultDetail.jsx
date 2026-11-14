import PollResultChart from './PollResultChart.jsx';
import { Link } from 'react-router-dom';
import styles from '../../styles/PollResult.module.scss';

/** 결과 조회 API 응답을 출력한다. DTO 이외의 필드(질문, 상태 등)는 임의로 가정하지 않는다. */
export default function PollResultDetail({
  results,
  myOptionId,
  loading,
  error,
  eventName,
  sessionName,
  backTo,
  onRefresh,
}) {
  if (loading) {
    return (
      <section className="rounded-xl border bg-white p-5 shadow-sm">투표 결과 조회 중...</section>
    );
  }

  if (error) {
    return (
      <p className="rounded-lg bg-red-50 p-3 text-red-700" role="alert">
        {error}
      </p>
    );
  }

  if (!results) return <p>조회된 결과가 없습니다.</p>;
  return (
    <section className={styles.resultCard}>
      {/* 행사 정보와 오른쪽 버튼 */}
      <div className={styles.resultTop}>
        <div className={styles.eventInfo}>
          <span className={styles.infoLabel}>행사명</span>
          <h2 className={styles.eventName}>{eventName || '정보 없음'}</h2>
        </div>

        <div className={styles.resultActions}>
          <Link to={backTo} className={styles.backButton}>
            돌아가기
          </Link>

          <button
            type="button"
            className={styles.refreshButton}
            disabled={loading}
            onClick={onRefresh}
          >
            새로고침
          </button>
        </div>
      </div>

      {/* 세션 정보 */}
      <div className={styles.sessionInfo}>
        <span className={styles.infoLabel}>세션명</span>
        <p className={styles.sessionName}>{sessionName || '정보 없음'}</p>
      </div>

      {/* 결과 로딩 및 오류 */}
      {loading && (
        <p className={styles.resultMessage} role="status">
          투표 결과 조회 중...
        </p>
      )}

      {!loading && error && (
        <p className={styles.resultError} role="alert">
          {error}
        </p>
      )}

      {!loading && !error && !results && (
        <p className={styles.resultMessage}>조회된 결과가 없습니다.</p>
      )}

      {/* 투표 결과 */}
      {!loading && !error && results && (
        <>
          <div className={styles.voteSummary}>
            <span className={styles.infoLabel}>전체 투표 수</span>

            <div className={styles.totalVotes}>
              <strong>{results.totalVotes ?? 0}</strong>
              <span>표</span>
            </div>
          </div>

          {/* 기존 선택지별 결과 차트 */}
          <PollResultChart results={results} myOptionId={myOptionId} />
        </>
      )}
    </section>
  );
}
