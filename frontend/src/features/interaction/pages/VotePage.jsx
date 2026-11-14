import { useVotePage } from '../hooks/vote/useVotePage.js';
import VotePollList from '../components/vote/VotePollList.jsx';
import VotePollDetail from '../components/vote/VotePollDetail.jsx';

import { mapClassNames } from '../../../styles/classNames.js';
import module0 from '../../../components/layout/header.module.scss';
import Header from '../../../components/layout/LegacyHeader.jsx';

import styles from '../styles/Vote.module.scss';
import ChatPanel from '../components/chat/ChatPanel.jsx';
import { useAuth } from '../../member/hooks/useAuth.js';
import headerStyles from '../styles/PollHeader.module.scss';

const cx = (value) => mapClassNames(value, module0);

/**
 * VotePage: 승인된 사용자의 투표 목록, 참여, 결과 조회 및 실시간 알림을 관리하는 화면.
 * REST API 호출은 pollApi, 실시간 메시지 연결은 connectPollSocket에 위임한다.
 * (직접 호출 위치는 useVotePage/useVoteRealtime Hook으로 이동했다.)
 */
export default function VotePage() {
  const {
    polls,
    selectedId,
    setSelectedId,
    optionId,
    setOptionId,
    results,
    error,
    notice,
    busy,
    socketConnected,
    socketRef,
    poll,
    submitted,
    canViewResults,
    submit,
    showResults,
  } = useVotePage();

  // 현재 로그인한 사용자의 역할
  const { role } = useAuth();

  // 화면 렌더링: 투표 목록 / 선택지 / 결과 / 연결·오류 상태를 표시한다.
  return (
    <div className={cx('app-shell')}>
      {/* 로그인 사용자 역할에 따라 관리자/일반 사용자 헤더 표시 */}
      <Header role={role === 'ADMIN' ? 'ADMIN' : 'USER'} activePage="votes" />
      {/* 실시간 투표 본문 전체 너비 적용 */}
      <main className={cx('app-main-content w-full min-w-0 space-y-5')}>
        <header className={headerStyles.pollPageHeader}>
          <div>
            <h1>실시간 투표</h1>
            <p>
              승인된 행사 참가자에게 공개된 투표입니다.{' '}
              {socketConnected ? '실시간 연결됨' : '주기적으로 업데이트 중'}
            </p>
          </div>

          <span
            className={`${headerStyles.pollPageRole} ${
              role === 'ADMIN' ? headerStyles.pollPageRoleAdmin : headerStyles.pollPageRoleUser
            }`}
          >
            {role === 'ADMIN' ? 'ADMIN' : 'USER'}
          </span>
        </header>

        {/* 요청 실패 시 오류 메시지 표시. */}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        {/* 투표 제출 성공 등 상태 안내 메시지 표시. */}
        {notice && (
          <p className={styles.notice} role="status">
            {notice}
          </p>
        )}

        {/* 왼쪽은 투표 목록, 오른쪽은 선택한 투표 상세 화면. */}
        <div className={styles.voteLayout}>
          <VotePollList polls={polls} selectedId={selectedId} setSelectedId={setSelectedId} />

          <VotePollDetail
            poll={poll}
            submitted={submitted}
            optionId={optionId}
            setOptionId={setOptionId}
            busy={busy}
            canViewResults={canViewResults}
            submit={submit}
            showResults={showResults}
            results={results}
          />

          <ChatPanel
            poll={poll}
            sessionId={poll?.sessionId ?? null}
            socketRef={socketRef}
            socketConnected={socketConnected}
          />
        </div>
      </main>
    </div>
  );
}
