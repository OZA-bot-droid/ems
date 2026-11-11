import { useEffect, useState } from 'react';
import { pollApi } from '../../api/pollApi.js';

/** 관리자·일반 사용자 공통 결과 조회. URL의 pollId만으로 결과를 요청한다. */
export function usePollTotalResults(pollId) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setResults(null); // 이전 투표의 결과가 잠시 표시되는 것을 방지
    setError('');

    if (!pollId || !/^\d+$/.test(String(pollId))) {
      setLoading(false);
      setError('유효한 투표 ID가 아닙니다.');
      return () => {
        active = false;
      };
    }

    setLoading(true);
    pollApi
      .results(pollId)
      .then((data) => {
        if (active) setResults(data);
      })
      .catch((err) => {
        if (active) setError(err.message || '투표 결과 조회에 실패했습니다.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [pollId, reloadKey]);

  return { results, loading, error, reload: () => setReloadKey((value) => value + 1) };
}
