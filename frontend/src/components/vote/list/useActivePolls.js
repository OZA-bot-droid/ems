// 파일 기능: 활성 투표와 참여 기록의 로딩·상태 변경 갱신을 관리합니다.

import { useCallback, useEffect, useState } from 'react';
import { getActivePollsApi } from './getActivePollsApi.js';
import { getActivePollVotesApi } from './getActivePollVotesApi.js';
import { usePollStatusUpdates } from '../../../hooks/usePollStatusUpdates.js';

// 함수 역할: 서버 투표를 화면에서 사용하는 모델로 변환합니다.
function mapServerPoll(item) {
  return {
    ...item,
    id: String(item.id),
    eventName: `행사 ${item.eventId} / 세션 ${item.sessionId}`,
    options: [...(item.options || [])]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((option) => ({ id: option.id, content: option.content, seed: 0 })),
  };
}

// 함수 역할: 활성 투표와 사용자 참여 이력을 로드·갱신합니다.
export function useActivePolls() {
  // 변수 역할: 조회된 활성 투표 목록
  const [polls, setPolls] = useState([]);
  // 변수 역할: 사용자가 이미 참여한 투표 기록
  const [serverVoteResults, setServerVoteResults] = useState([]);
  // 변수 역할: 조회 요청 진행 여부
  const [loading, setLoading] = useState(true);
  // 변수 역할: 조회 실패 안내 메시지
  const [error, setError] = useState('');

  const loadPolls = useCallback(async ({ showLoading = false, signal } = {}) => {
    if (showLoading) setLoading(true);
    try {
      const items = await getActivePollsApi({ signal });
      if (signal?.aborted) return;
      const voteResults = await getActivePollVotesApi(
        items.map((item) => item.id),
        { signal },
      );
      if (signal?.aborted) return;
      setPolls(items.map(mapServerPoll));
      setServerVoteResults(voteResults);
      setError('');
    } catch (err) {
      if (signal?.aborted || err?.name === 'AbortError') return;
      setError(err.message || '투표 정보를 불러오지 못했습니다.');
    } finally {
      if (showLoading && !signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadPolls({ showLoading: true, signal: controller.signal });
    return () => controller.abort();
  }, [loadPolls]);

  usePollStatusUpdates({ onStatusChanged: () => loadPolls() });
  return { polls, serverVoteResults, setServerVoteResults, loading, error, loadPolls };
}
