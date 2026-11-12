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

      <main className={`${cx('app-main-content')} ${styles.main}`}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>전체 투표 목록</h1>
          <p className={styles.pageDescription}>참가 승인된 행사들의 투표 목록입니다.</p>
        </div>

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
