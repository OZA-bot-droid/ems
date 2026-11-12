import { useCallback, useEffect, useState } from 'react';
import { pollApi } from '../../api/pollApi.js';
import { useNavigate } from 'react-router-dom';

// 관리자 Poll 목록 조회, 필터, 페이징 및 활성화·종료 로직
export function usePollManagement(eventFilter, sessionFilter, mutationLock) {
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState([]);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const refresh = useCallback(
    async ({ silent = false } = {}) => {
      // 최초 조회와 페이지 이동 시에만 로딩 표시
      if (!silent) {
        setLoading(true);
        setError('');
      }

      try {
        const data = await pollApi.mine({
          page,
          size: 10,
          ...(eventFilter ? { eventId: eventFilter } : {}),
          ...(sessionFilter ? { sessionId: sessionFilter } : {}),
        });

        setRows(data.content || []);
        setPages(data.totalPages || 0);
      } catch (e) {
        if (!silent) {
          setError(e.message);
        } else {
          // 자동 갱신 실패 시 기존 화면 유지
          console.error('투표 목록 자동 갱신 실패:', e);
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [page, eventFilter, sessionFilter],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    setPage(0);
  }, [eventFilter, sessionFilter]);

  async function change(id, action) {
    // 생성과 상태 변경은 동일한 공유 잠금으로 중복 실행을 방지한다.
    if (mutationLock.current) return;
    mutationLock.current = true;
    setBusy(true);
    setError('');
    try {
      await pollApi[action](id);
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      mutationLock.current = false;
      setBusy(false);
    }
  }

  // 결과 확인: 선택한 투표의 공통 결과 조회 페이지로 이동
  function goToResults(pollId) {
    if (pollId == null) return;

    navigate(`/polls/${encodeURIComponent(pollId)}/results`, {
      state: { from: '/admin/polls' },
    });
  }

  return { page, setPage, rows, pages, loading, busy, error, refresh, change, goToResults };
}
