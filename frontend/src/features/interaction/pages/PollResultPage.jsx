import { useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../member/hooks/useAuth.js';
import Header from '../../../components/layout/LegacyHeader.jsx';
import { mapClassNames } from '../../../styles/classNames.js';
import module0 from '../../../components/layout/header.module.scss';

import PollResultHeader from '../components/result/PollResultHeader.jsx';
import PollResultDetail from '../components/result/PollResultDetail.jsx';
import { usePollTotalResults } from '../hooks/result/usePollTotalResults.js';

import styles from '../styles/PollResult.module.scss';

const cx = (value) => mapClassNames(value, module0);

/** 관리자와 일반 사용자가 공통으로 사용하는 투표 결과 페이지 */
export default function PollResultPage() {
  const { pollId } = useParams();
  const location = useLocation();

  // 현재 로그인 사용자의 역할 확인
  const { role } = useAuth();

  // 결과 페이지에 진입한 경로 확인
  const from = location.state?.from;

  // 전체 투표 결과 및 사용자 본인 투표 기록 조회
  const { results, myOptionId, loading, error, reload } = usePollTotalResults(pollId, role);

  return (
    <div className={cx('app-shell')}>
      <Header />

      <main className={`${cx('app-main-content')} ${styles.main}`}>
        {/* 결과 페이지 제목 및 새로고침 버튼 */}
        <div className={styles.pageHeader}>
          <PollResultHeader from={from} pollId={pollId} onRefresh={reload} loading={loading} />
        </div>

        {/* 투표 결과 표시 */}
        <div className={styles.resultCard}>
          <PollResultDetail
            results={results}
            myOptionId={myOptionId}
            loading={loading}
            error={error}
          />
        </div>
      </main>
    </div>
  );
}
