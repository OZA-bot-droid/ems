import { useEffect, useState } from 'react';
import { pollApi } from '../../api/pollApi.js';

/**
 * 관리자·일반 사용자 공통 결과 조회.
 * URL의 pollId로 결과를 요청하고,
 * 일반 사용자일 때만 본인 투표 기록을 추가 조회한다.
 */
export function usePollTotalResults(pollId, role) {
  const [results, setResults] = useState(null);

  // 현재 로그인 사용자가 선택한 선택지 ID
  const [myOptionId, setMyOptionId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    // 이전 투표의 결과 및 본인 투표 기록이 잠시 표시되는 것을 방지
    setResults(null);
    setMyOptionId(null);
    setError('');

    // 기존 투표 ID 검증 유지
    if (!pollId || !/^\d+$/.test(String(pollId))) {
      setLoading(false);
      setError('유효한 투표 ID가 아닙니다.');

      return () => {
        active = false;
      };
    }

    // 로그인 역할 확인 전에는 결과 조회 대기
    if (!role) {
      setLoading(true);

      return () => {
        active = false;
      };
    }

    setLoading(true);

    async function load() {
      // 관리자는 전체 결과만 조회
      // 일반 사용자는 전체 결과와 본인 투표 기록 조회
      const requests = [pollApi.results(pollId)];

      if (role === 'USER') {
        requests.push(pollApi.activeVotes([pollId]));
      }

      // 본인 기록 조회 실패가 전체 결과 조회를 막지 않도록 처리
      const [resultResponse, voteResponse] = await Promise.allSettled(requests);

      // 이전 요청이나 언마운트된 컴포넌트의 응답은 무시
      if (!active) return;

      // 전체 투표 결과 처리
      if (resultResponse.status === 'fulfilled') {
        setResults(resultResponse.value);
      } else {
        setError(resultResponse.reason?.message || '투표 결과 조회에 실패했습니다.');
      }

      // 일반 사용자만 본인 투표 기록 처리
      if (role === 'USER' && voteResponse) {
        if (voteResponse.status === 'fulfilled') {
          const votes = Array.isArray(voteResponse.value) ? voteResponse.value : [];

          // 현재 투표 ID에 해당하는 사용자 투표 기록 찾기
          const myVote = votes.find((vote) => String(vote.pollId) === String(pollId));

          setMyOptionId(myVote?.pollOptionId ?? null);
        } else {
          // 본인 투표 기록 조회 실패 시 전체 결과는 유지
          console.error('본인 투표 기록 조회 실패:', voteResponse.reason);

          setMyOptionId(null);
        }
      }

      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, [pollId, role, reloadKey]);

  return {
    results,
    myOptionId,
    loading,
    error,
    reload: () => setReloadKey((value) => value + 1),
  };
}
