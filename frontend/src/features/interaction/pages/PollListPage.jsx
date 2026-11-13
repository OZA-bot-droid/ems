import Header from '../../../components/layout/LegacyHeader.jsx';
import module0 from '../../../components/layout/header.module.scss';
import { mapClassNames } from '../../../styles/classNames.js';
import ApprovedPollResultList from '../components/result/ApprovedPollResultList.jsx';
import PollListPagination from '../components/result/PollListPagination.jsx';
import { useApprovedPolls } from '../hooks/result/useApprovedPolls.js';

import styles from '../styles/PollList.module.scss';

const cx = (value) => mapClassNames(value, module0);

/**
 * 일반 사용자 투표 목록 페이지 (/polls/user).
 * 서버의 참가 승인 세션 투표 목록 API를 사용하며, '결과 확인'으로 공통 결과 페이지에 진입한다.
 */
export default function PollListPage() {
  const { polls, page, setPage, pages, totalElements, loading, error, reload } = useApprovedPolls();

  return (
    <div className={cx('app-shell')}>
      <Header role="USER" activePage="votes" />
      {/* 참가 가능한 투표 목록 전체 너비 적용 */}
      <main className={cx('app-main-content w-full min-w-0 space-y-5 text-slate-800')}>
        <header>
          <h1 className="text-2xl font-bold">투표 목록</h1>
          <p className="text-sm text-slate-500">참가 승인된 세션의 투표 목록입니다.</p>
        </header>
        <ApprovedPollResultList polls={polls} loading={loading} error={error} reload={reload} />
        <PollListPagination
          page={page}
          pages={pages}
          totalElements={totalElements}
          loading={loading}
          onPageChange={setPage}
        />
      </main>
    </div>
  );
}
