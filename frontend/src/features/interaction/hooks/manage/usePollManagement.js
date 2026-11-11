import { useCallback, useEffect, useState } from 'react';
import { pollApi } from '../../api/pollApi.js';

// 관리자 Poll 목록 조회, 필터, 페이징 및 활성화·종료 로직
export function usePollManagement(eventFilter, sessionFilter, mutationLock) {
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState([]);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
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
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, eventFilter, sessionFilter]);

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

  return { page, setPage, rows, pages, loading, busy, error, refresh, change };
}
