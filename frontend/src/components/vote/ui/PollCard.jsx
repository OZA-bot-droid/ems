// 파일 기능: 투표 정보와 선택·결과 UI를 하나의 카드로 조합합니다.

import { useState } from 'react';
import CreatePollModal from '../../poll/create/CreatePollModal.jsx';
import PollOptions from './PollOptions.jsx';
import PollResults from '../../poll/result/PollResults.jsx';
import styles from './PollCard.module.scss';

// 함수 역할: 현재 투표의 질문·선택·결과 화면을 렌더링합니다.
export default function PollCard({ voting }) {
  const [isCreateOpen, setCreateOpen] = useState(false);

  const {
    poll,
    selected,
    submittedOption,
    submitted,
    isSubmitting,
    totals,
    showResults,
    notice,
    selectOption,
    submitVote,
    createServerPoll,
    openResults,
    closeResults,
    stompConnected,
    pollResult,
    resultLoading,
    resultError,
    refreshResults,
  } = voting;

  return (
    <section className={styles.voteCard} aria-labelledby="vote-heading">
      <div className={styles.cardHead}>
        <h2 id="vote-heading">{poll.eventName}</h2>
        {/* <span className={styles.badge}>서버 DB 투표</span> */}
        <span className={styles.badge}>
          {stompConnected ? '● 실시간 연결됨' : '○ 실시간 연결 안 됨'}
        </span>
      </div>
      <h3>{poll.title}</h3>
      {showResults ? (
        <PollResults
          totals={totals}
          totalVotes={pollResult?.totalVotes ?? 0}
          submittedOption={submittedOption}
          loading={resultLoading}
          error={resultError}
          onRefresh={refreshResults}
          onBack={closeResults}
        />
      ) : (
        <>
          <PollOptions
            options={poll.options}
            selected={selected}
            onSelect={selectOption}
            disabled={submitted}
          />
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.submit}
              onClick={submitVote}
              disabled={submitted || isSubmitting || poll.status !== 'ACTIVE'}
            >
              {isSubmitting ? '제출 중...' : submitted ? '투표 완료' : '투표 제출'}
            </button>
            <button type="button" className={styles.outline} onClick={openResults}>
              투표 결과 보기
            </button>
            <button
              type="button"
              className={styles.createButton}
              onClick={() => setCreateOpen(true)}
            >
              ＋ 투표 생성
            </button>
          </div>
        </>
      )}
      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}
      <p className={styles.guidance}>서비스 정책: 1인 1회 참여 · 승인된 참가자만 투표 가능</p>
      {/* <p className={styles.demoWarning} role="note">
        투표 목록·선택지·투표 제출은 서버 API를 사용합니다. 현재 결과 그래프는 브라우저 기록 기반의
        예시이며 DB의 전체 득표수는 표시하지 않습니다. 투표 완료 후에는 서버에서 중복 제출을
        차단합니다.
      </p> */}

      {isCreateOpen && (
        <CreatePollModal onClose={() => setCreateOpen(false)} onCreate={createServerPoll} />
      )}
    </section>
  );
}
