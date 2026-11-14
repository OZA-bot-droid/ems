import Header from '../../../components/layout/LegacyHeader.jsx';
import module0 from '../../../components/layout/header.module.scss';
import { mapClassNames } from '../../../styles/classNames.js';
import ApprovedPollResultList from '../components/result/ApprovedPollResultList.jsx';
import PollListPagination from '../components/result/PollListPagination.jsx';
import { useApprovedPolls } from '../hooks/result/useApprovedPolls.js';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../member/hooks/useAuth.js';

import styles from '../styles/PollList.module.scss';
import headerStyles from '../styles/PollHeader.module.scss';

const cx = (value) => mapClassNames(value, module0);

/**
 * 일반 사용자 투표 목록 페이지 (/polls/user).
 * 서버의 참가 승인 세션 투표 목록 API를 사용하며, '결과 확인'으로 공통 결과 페이지에 진입한다.
 */
export default function PollListPage() {
  const { polls, page, setPage, pages, totalElements, loading, error, reload } = useApprovedPolls();

  const location = useLocation();

  const backTo = location.state?.from === '/polls/vote' ? '/polls/vote' : '/events';

  // 로그인 사용자 역할
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';

  return (
    <div className={cx('app-shell')}>
      {/* 로그인 역할에 따라 사이드바 구분 */}
      <Header role={isAdmin ? 'ADMIN' : 'USER'} activePage="votes" />
      {/* 참가 가능한 투표 목록 전체 너비 적용 */}
      <main className={cx('app-main-content w-full min-w-0 space-y-5 text-slate-800')}>
        <header className={headerStyles.pollPageHeader}>
          <div>
            <h1>투표 목록</h1>
            <p>참가 승인된 세션의 투표 목록입니다.</p>
          </div>

          <span
            className={`${headerStyles.pollPageRole} ${
              isAdmin ? headerStyles.pollPageRoleAdmin : headerStyles.pollPageRoleUser
            }`}
          >
            {isAdmin ? 'ADMIN' : 'USER'}
          </span>
        </header>
        <ApprovedPollResultList
          polls={polls}
          loading={loading}
          error={error}
          reload={reload}
          backTo={backTo}
        />
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
