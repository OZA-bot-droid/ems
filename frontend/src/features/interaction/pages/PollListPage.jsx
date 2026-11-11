import Header from '../../../components/layout/LegacyHeader.jsx';
import module0 from '../../../components/layout/header.module.scss';
import { mapClassNames } from '../../../styles/classNames.js';
import ApprovedPollResultList from '../components/result/ApprovedPollResultList.jsx';
import PollListPagination from '../components/result/PollListPagination.jsx';
import { useApprovedPolls } from '../hooks/result/useApprovedPolls.js';

const cx = (value) => mapClassNames(value, module0);

/**
 * 일반 사용자 투표 목록 페이지 (/polls).
 * 서버의 참가 승인 세션 투표 목록 API를 사용하며, '결과 확인'으로 공통 결과 페이지에 진입한다.
 */
export default function PollListPage() {
  const { polls, page, setPage, pages, totalElements, loading, error, reload } = useApprovedPolls();

  return (
    <div className={cx('app-shell')}>
      <Header role="USER" activePage="votes" />
      <main className="mx-auto max-w-6xl space-y-5 p-5 text-slate-800">
        <header>
          <p className="text-sm text-emerald-700">SYNC5 / Interaction</p>
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
