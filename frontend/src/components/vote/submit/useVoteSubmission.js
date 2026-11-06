// 파일 기능: 투표 제출 가능 여부 검사와 중복 제출 방지를 담당합니다.

import { useState } from 'react';
import { submitPollVoteApi } from './submitPollVoteApi.js';

// 함수 역할: 유효한 선택인지 검사한 뒤 투표를 제출합니다.
export function useVoteSubmission({
  poll,
  selected,
  submittedOption,
  setServerVoteResults,
  setNotice,
  setShowResults,
}) {
  // 변수 역할: 제출 요청 중복 방지 상태
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 함수 역할: 투표 상태와 시간·중복 여부를 검증하고 제출합니다.
  async function submitVote() {
    if (isSubmitting) return;
    if (!poll || poll.status !== 'ACTIVE') {
      setNotice('진행 중인 투표에만 참여할 수 있습니다.');
      return;
    }
    if (poll.startsAt && poll.endsAt) {
      const now = Date.now();
      if (now < Date.parse(poll.startsAt) || now >= Date.parse(poll.endsAt)) {
        setNotice('현재는 투표 가능한 시간이 아닙니다.');
        return;
      }
    }
    if (submittedOption !== null) {
      setNotice('이미 투표를 제출했습니다.');
      return;
    }
    if (selected === null) {
      setNotice('투표할 항목을 선택해 주세요.');
      return;
    }
    setIsSubmitting(true);
    setNotice('');
    try {
      await submitPollVoteApi(poll.id, selected);
      setServerVoteResults((previous) => [
        ...previous.filter((result) => String(result.pollId) !== poll.id),
        { pollId: Number(poll.id), pollOptionId: selected },
      ]);
      setNotice('투표가 정상적으로 전송되었습니다.');
      setShowResults(false);
    } catch (error) {
      setNotice(error.message || '투표 제출에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return { isSubmitting, submitVote };
}
