// 파일 기능: 사용자의 실시간 투표 선택·제출·결과 화면을 렌더링합니다.

import Sidebar from '../../components/layout/Sidebar.jsx';
import PollList from '../../components/poll/list/PollList.jsx';
import PollCard from '../../components/vote/ui/PollCard.jsx';
import { useVoting } from '../../components/vote/hooks/useVoting.js';
import styles from './Voting.module.scss';

// 함수 역할: 실시간 투표 참여 화면을 구성합니다.
export default function Voting() {
  // 변수 역할: 투표 화면의 상태와 사용자 동작을 모은 객체
  const voting = useVoting();

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <header className={styles.pageHeader}>
          <div>
            <h1>08 · 실시간 투표</h1>
            <p>승인된 세션의 활성화된 투표 목록을 서버에서 조회합니다.</p>
          </div>
          <span className={styles.badge}>USER</span>
        </header>
        {voting.loading && <p role="status">투표 목록을 불러오는 중입니다.</p>}
        {voting.error && (
          <div role="alert">
            <p>{voting.error}</p>
            <button type="button" onClick={voting.reloadPolls}>
              다시 시도
            </button>
          </div>
        )}
        {!voting.loading && !voting.error && voting.polls.length === 0 && (
          <p role="status">현재 참가 중인 세션에 활성화된 투표가 없습니다.</p>
        )}
        {voting.polls.length > 0 && (
          <div className={styles.pollLayout}>
            <PollList
              polls={voting.polls}
              selectedPollId={voting.poll?.id}
              onSelect={voting.selectPoll}
            />
            {voting.poll && <PollCard voting={voting} />}
          </div>
        )}
        {/* <footer className={styles.footer}>
          투표 목록·질문·선택지·투표 제출은 서버 DB 연동 · 결과 그래프는 브라우저 기록 기반 예시
        </footer> */}
      </main>
    </div>
  );
}
