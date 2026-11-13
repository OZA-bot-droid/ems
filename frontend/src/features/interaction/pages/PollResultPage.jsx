import { useLocation, useParams } from 'react-router-dom';
import Header from '../../../components/layout/LegacyHeader.jsx';
import module0 from '../../../components/layout/header.module.scss';
import { mapClassNames } from '../../../styles/classNames.js';
import PollResultHeader from '../components/result/PollResultHeader.jsx';
import PollResultDetail from '../components/result/PollResultDetail.jsx';
import { usePollTotalResults } from '../hooks/result/usePollTotalResults.js';

const cx = (value) => mapClassNames(value, module0);

/**
 * 관리자와 일반 사용자가 공유하는 결과 페이지.
 * /polls/:pollId/results 진입. location.state.from은 뒤로가기 UI 용도일 뿐 권한 근거가 아니다.
 */
export default function PollResultPage() {
  const { pollId } = useParams();
  const location = useLocation();
  const from = location.state?.from;
  const isAdminEntry = from === '/admin/polls' || from === '/polls/manage';
  const { results, loading, error, reload } = usePollTotalResults(pollId);

  return (
    <div className={cx('app-shell')}>
      <Header role={isAdminEntry ? 'ADMIN' : 'USER'} activePage="votes" />
      {/* 투표 결과 본문 전체 너비 적용 */}
      <main className={cx('app-main-content w-full min-w-0 space-y-5 text-slate-800')}>
        <PollResultHeader from={from} pollId={pollId} onRefresh={reload} loading={loading} />
        <PollResultDetail results={results} loading={loading} error={error} />
      </main>
    </div>
  );
}
