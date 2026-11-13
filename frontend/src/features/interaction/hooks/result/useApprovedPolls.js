import { useCallback, useEffect, useRef, useState } from 'react';
import { pollApi } from '../../api/pollApi.js';

/**
 * 일반 사용자: 참가 승인된 세션의 투표 목록을 페이지 단위로 조회한다.
 * GET /interactions/polls/users?page={page}&size={size}
 * X-Member-Id는 Gateway/백엔드 인증 흐름에서 처리하며, 임의 사용자 ID를 요청에 넣지 않는다.
 */
export function useApprovedPolls() {
  const [page, setPage] = useState(0);
  const [polls, setPolls] = useState([]);
  const [pages, setPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const latestRequest = useRef(0);

  const reload = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    // 페이지 이동/새로고침이 겹치면 최신 요청의 응답만 상태에 반영한다.
    const requestId = ++latestRequest.current;
    setLoading(true);
    setError('');

    pollApi
      .userPolls({ page, size: 10 })
      .then((response) => {
        if (requestId !== latestRequest.current) return;
        // PageResponse.from(Page<UserPollDTO>)에 대응한다.
        // API unwrap() 이후의 최종 응답 구조에 content/totalPages가 있어야 한다.
        if (!response || !Array.isArray(response.content)) {
          throw new Error('투표 목록 페이지 응답 형식을 확인해 주세요.');
        }
        setPolls(response.content);
        setPages(Number(response.totalPages ?? 0));
        setTotalElements(Number(response.totalElements ?? response.content.length));
      })
      .catch((err) => {
        if (requestId !== latestRequest.current) return;
        setPolls([]);
        setPages(0);
        setTotalElements(0);
        setError(err.message || '투표 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (requestId === latestRequest.current) setLoading(false);
      });

    return () => {
      latestRequest.current += 1;
    };
  }, [page, reloadKey]);

  return { page, setPage, polls, pages, totalElements, loading, error, reload };
}
