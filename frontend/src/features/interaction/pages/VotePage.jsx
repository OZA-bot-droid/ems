import { useVotePage } from '../hooks/vote/useVotePage.js';
import VotePollList from '../components/vote/VotePollList.jsx';
import VotePollDetail from '../components/vote/VotePollDetail.jsx';

import { mapClassNames } from '../../../styles/classNames.js';
import module0 from '../../../components/layout/header.module.scss';
import Header from '../../../components/layout/LegacyHeader.jsx';

import styles from '../styles/Vote.module.scss';

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
    poll,
    submitted,
    canViewResults,
    submit,
    showResults,
  } = useVotePage();

  // 화면 렌더링: 투표 목록 / 선택지 / 결과 / 연결·오류 상태를 표시한다.
  return (
    <div className={cx('app-shell')}>
      {/* 전체 화면 레이아웃 및 사용자용 공통 헤더. */}
      <Header role="USER" activePage="votes" />

      <main className={`${cx('app-main-content')} ${styles.main}`}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>실시간 투표</h1>
          <p className={styles.pageDescription}>
            승인된 행사 참가자에게 공개된 투표입니다. {socketConnected ? '' : '실시간 연결 실패'}
          </p>
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
        </div>
      </main>
    </div>
  );
}
