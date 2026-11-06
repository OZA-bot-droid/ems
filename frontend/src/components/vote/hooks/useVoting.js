// 파일 기능: 투표 선택·제출·결과 조회를 하나의 훅으로 묶습니다.

import { useEffect, useState } from 'react';
import { useActivePolls } from '../list/useActivePolls.js';
import { usePollVoteUpdates } from '../realtime/usePollVoteUpdates.js';
import { usePollResults } from '../result/usePollResults.js';
import { useVoteSubmission } from '../submit/useVoteSubmission.js';

// 실시간 투표 관련 UI 병합.
export function useVoting() {
  const { demoUserId, polls, serverVoteResults, setServerVoteResults, loading, error, loadPolls } =
    useActivePolls();
  // 변수 역할: 화면에서 선택한 투표의 식별자
  const [selectedPollId, setSelectedPollId] = useState(null);
  // 변수 역할: 투표에서 선택한 항목
  const [selected, setSelected] = useState(null);
  // 변수 역할: 투표 결과 창 표시 여부
  const [showResults, setShowResults] = useState(false);
  // 변수 역할: 사용자에게 표시할 알림 메시지
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setSelectedPollId((current) =>
      polls.some((item) => item.id === current) ? current : (polls[0]?.id ?? null),
    );
  }, [polls]);

  // 변수 역할: 현재 선택된 투표 데이터
  const poll = polls.find((item) => item.id === selectedPollId) ?? polls[0] ?? null;
  const currentVoteResult = serverVoteResults.find((result) => String(result.pollId) === poll?.id);
  const submittedOption = currentVoteResult?.pollOptionId ?? null;

  const { stompConnected, refreshKey, refreshResults } = usePollVoteUpdates(poll?.id, demoUserId);
  const { pollResult, resultLoading, resultError, totals } = usePollResults(
    poll?.id,
    showResults,
    refreshKey,
  );
  const { isSubmitting, submitVote } = useVoteSubmission({
    poll,
    selected,
    submittedOption,
    setServerVoteResults,
    setNotice,
    setShowResults,
  });

  // 함수 역할: 현재 투표를 바꾸고 이전 선택을 초기화합니다.
  function selectPoll(id) {
    setSelectedPollId(id);
    setSelected(null);
    setShowResults(false);
    setNotice('');
  }

  // 함수 역할: 선택한 선택지 ID를 갱신합니다.
  function selectOption(id) {
    setSelected(id);
    setNotice('');
  }

  // 함수 역할: 공개 가능 여부를 검사한 뒤 결과를 엽니다.
  function openResults() {
    if (!poll) return;
    if (poll.showLiveResults === false && poll.status !== 'CLOSED') {
      setNotice('이 투표는 종료된 후에 결과를 공개합니다.');
      return;
    }
    setShowResults(true);
    setNotice('');
  }

  // 함수 역할: 결과 화면을 닫습니다.
  function closeResults() {
    setShowResults(false);
    setNotice('');
  }

  // 함수 역할: 서버의 ACTIVE 투표 목록을 다시 조회합니다.
  async function createServerPoll() {
    await loadPolls();
    setNotice('서버 투표를 생성했습니다. 참여 가능한 ACTIVE 투표만 목록에 표시됩니다.');
  }

  return {
    poll,
    polls,
    loading,
    error,
    reloadPolls: () => loadPolls({ showLoading: true }),
    selected: submittedOption ?? selected,
    submittedOption,
    submitted: submittedOption !== null,
    isSubmitting,
    totals,
    showResults,
    notice,
    selectPoll,
    selectOption,
    submitVote,
    openResults,
    closeResults,
    createServerPoll,
    stompConnected,
    pollResult,
    resultLoading,
    resultError,
    refreshResults,
  };
}
