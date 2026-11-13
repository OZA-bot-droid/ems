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

  const eventName = location.state?.eventName || '';
  const sessionName = location.state?.sessionName || '';

  return (
    <div className={cx('app-shell')}>
      <Header role={role} activePage="votes" />
      {/* 투표 결과 본문 전체 너비 적용 */}
      <main className={cx('app-main-content w-full min-w-0 space-y-5 text-slate-800')}>
        <PollResultHeader from={from} pollId={pollId} onRefresh={reload} loading={loading} />
        <PollResultDetail
          results={results}
          myOptionId={myOptionId}
          loading={loading}
          error={error}
          eventName={eventName}
          sessionName={sessionName}
        />
      </main>
    </div>
  );
}
