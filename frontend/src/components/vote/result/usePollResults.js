// 파일 기능: 투표 결과의 비동기 조회와 득표 목록 변환을 관리합니다.

import { useEffect, useMemo, useState } from 'react';
import { getPollResultsApi } from './getPollResultsApi.js';

// 함수 역할: 결과 조회 요청과 로딩·오류 상태를 관리합니다.
export function usePollResults(pollId, showResults, refreshKey) {
  // 변수 역할: 서버에서 조회한 투표 결과
  const [pollResult, setPollResult] = useState(null);
  // 변수 역할: 투표 결과 로딩 상태
  const [resultLoading, setResultLoading] = useState(false);
  // 변수 역할: 결과 조회 오류
  const [resultError, setResultError] = useState('');

  useEffect(() => {
    if (!showResults || !pollId) {
      setPollResult(null);
      setResultError('');
      setResultLoading(false);
      return;
    }
    const controller = new AbortController();
    // 함수 역할: 선택한 투표의 최신 결과를 불러옵니다.
    async function loadResults() {
      setResultLoading(true);
      setResultError('');
      setPollResult(null);
      try {
        const result = await getPollResultsApi(pollId, { signal: controller.signal });
        if (!controller.signal.aborted) setPollResult(result);
      } catch (error) {
        if (!controller.signal.aborted) {
          setResultError(error.message || '투표 결과를 불러오지 못했습니다.');
        }
      } finally {
        if (!controller.signal.aborted) setResultLoading(false);
      }
    }
    loadResults();
    return () => controller.abort();
  }, [showResults, pollId, refreshKey]);

  // 변수 역할: 선택지별 득표수를 정리한 결과
  const totals = useMemo(
    () =>
      (pollResult?.options || []).map((option) => ({
        id: option.pollOptionId,
        content: option.content,
        count: option.voteCount,
      })),
    [pollResult],
  );

  return { pollResult, resultLoading, resultError, totals };
}
