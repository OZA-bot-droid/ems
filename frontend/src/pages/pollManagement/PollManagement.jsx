// 파일 기능: 관리자의 투표 조회·생성·상태 변경·페이지네이션 화면을 구성합니다.

import { useCallback, useEffect, useState } from 'react';
import Sidebar from '../../components/layout/Sidebar.jsx';
import CreatePollModal from '../../components/poll/create/CreatePollModal.jsx';
import { getMyCreatedPolls, updatePollStatus } from './pollManagementApi.js';
import styles from './PollManagement.module.scss';
import { usePollStatusUpdates } from '../../hooks/usePollStatusUpdates.js';
import axios from 'axios';

// 변수 역할: 투표 상태 코드를 화면 표시용 문구로 변환하는 표
const STATUS_LABELS = {
  SCHEDULED: '예정',
  ACTIVE: '진행 중',
  CLOSED: '종료',
};

// 함수 역할: 날짜를 한국어 화면 표시용 문자열로 변환합니다.
function formatDate(date) {
  if (!date) return '—';
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? '—'
    : parsed.toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' });
}

// 함수 역할: 관리자 투표 목록과 페이지 버튼·상태 변경 동작을 연결합니다.
export default function PollManagement() {
  // 변수 역할: 현재 페이지에서 보여줄 관리자 투표 목록
  const [polls, setPolls] = useState([]);
  // 변수 역할: 투표 목록 요청 진행 상태
  const [loading, setLoading] = useState(true);
  // 변수 역할: 투표 조회 실패 메시지
  const [error, setError] = useState('');
  // 변수 역할: 새 투표 생성 모달 표시 여부
  const [isCreateOpen, setCreateOpen] = useState(false);
  // 변수 역할: 현재 변경 중인 투표 ID
  const [pendingPollId, setPendingPollId] = useState(null);
  // 변수 역할: 투표 활성화·종료 실패 메시지
  const [actionError, setActionError] = useState('');

  // 변수 역할: 0부터 시작하는 현재 페이지 번호
  const [page, setPage] = useState(0);
  // 변수 역할: 전체 페이지 수
  const [totalPages, setTotalPages] = useState(0);
  // 변수 역할: 전체 투표 개수
  const [totalElements, setTotalElements] = useState(0);

  // 화면에 불러올 투표 개수
  const PAGE_SIZE = 10;

  // 화면에 표시할 페이지 번호 개수
  const PAGE_GROUP_SIZE = 5;

  // 현재 페이지를 중심으로 시작 페이지 계산
  const startPage = Math.max(
    0,
    Math.min(page - Math.floor(PAGE_GROUP_SIZE / 2), Math.max(0, totalPages - PAGE_GROUP_SIZE)),
  );

  // 실제 표시할 페이지 개수 (전체가 5페이지 미만일 수도 있음)
  const visiblePageCount = Math.min(PAGE_GROUP_SIZE, totalPages);

  // 표시할 페이지 번호 배열 (0부터 시작)
  const visiblePages = Array.from({ length: visiblePageCount }, (_, index) => startPage + index);

  // 함수 역할: 현재 페이지의 관리자 투표 목록을 서버에서 조회합니다.
  const loadPolls = useCallback(
    async (showLoading = false) => {
      if (showLoading) {
        setLoading(true);
      }

      try {
        const response = await getMyCreatedPolls(page, PAGE_SIZE);

        // 현재 페이지가 범위를 벗어난 경우
        if (response.totalPages > 0 && page >= response.totalPages) {
          setPage(response.totalPages - 1);
          return;
        }

        setPolls(response.content);
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
        setError('');
      } catch (err) {
        setError(err.message || '투표 목록을 불러오지 못했습니다.');
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [page],
  );

  // 최초 진입 시 REST 조회
  useEffect(() => {
    loadPolls(true);
  }, [loadPolls]);

  // 상태 변경 WebSocket 연결
  usePollStatusUpdates({
    onStatusChanged: () => {
      console.log('[ADMIN] 상태 변경 알림 → 관리자 목록 재조회');

      // 기존 화면을 유지하며 목록만 갱신
      loadPolls(false);
    },
  });

  // 함수 역할: 허용된 페이지 번호로 목록 페이지를 변경합니다.
  const handlePageChange = (nextPage) => {
    if (nextPage < 0 || nextPage >= totalPages) {
      return;
    }

    if (nextPage === page) {
      return;
    }

    setPage(nextPage);
  };

  // 함수 역할: 투표 생성 완료 후 첫 페이지 목록을 갱신합니다.
  const handleCreated = () => {
    // 서버에 저장된 목록을 다시 조회하여 화면에 반영
    if (page === 0) {
      loadPolls();
    } else {
      setPage(0);
    }
  };

  // 함수 역할: 투표를 활성화·종료하고 목록을 다시 조회합니다.
  const handleStatusChange = async (pollId, action) => {
    if (pendingPollId !== null) return;
    setPendingPollId(pollId);
    setActionError('');
    try {
      await updatePollStatus(pollId, action);
      await loadPolls();
    } catch (err) {
      setActionError(err.message || '투표 상태를 변경하지 못했습니다.');
    } finally {
      setPendingPollId(null);
    }
  };

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <header className={styles.pageHeader}>
          <div>
            <h1>투표 관리</h1>
            <p>행사·세션별 투표를 생성하고 운영합니다.</p>
          </div>
          <span className={styles.badge}>ADMIN</span>
        </header>

        <section className={styles.panel} aria-labelledby="poll-list-heading">
          <div className={styles.panelHeading}>
            <div>
              <h2 id="poll-list-heading">등록된 투표</h2>
              <p>관리자가 생성한 투표 목록입니다.</p>
            </div>
            <button
              className={styles.createButton}
              type="button"
              onClick={() => setCreateOpen(true)}
            >
              ＋ 새 투표 만들기
            </button>
          </div>

          {actionError ? (
            <p className={styles.actionError} role="alert">
              {actionError}
            </p>
          ) : null}
          {loading ? (
            <p className={styles.message} role="status">
              투표 목록을 불러오는 중입니다.
            </p>
          ) : null}
          {error ? (
            <div className={styles.message} role="alert">
              <p>{error}</p>
              <button type="button" className={styles.retry} onClick={loadPolls}>
                다시 시도
              </button>
            </div>
          ) : null}
          {!loading && !error && polls.length === 0 ? (
            <p className={styles.message}>아직 등록한 투표가 없습니다. 새 투표를 만들어 보세요.</p>
          ) : null}
          {!loading && polls.length > 0 ? (
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">투표 질문</th>
                    <th scope="col">행사 / 세션</th>
                    <th scope="col">시작 일시</th>
                    <th scope="col">종료 일시</th>
                    <th scope="col">상태</th>
                    <th scope="col">변경</th>
                  </tr>
                </thead>
                <tbody>
                  {polls.map((poll) => {
                    // 상태는 서버 DB의 status를 기준으로 표시합니다.
                    const status = poll.status || 'SCHEDULED';

                    // 활성화 가능 여부는 백엔드 서버 시간을 기준으로 판단
                    const canActivate = poll.canActivate === true;
                    const canClose = poll.canClose === true;

                    return (
                      <tr key={poll.id}>
                        <td className={styles.titleCell}>
                          <strong>{poll.title}</strong>
                          {/* <span>투표 #{poll.id}</span> */}
                        </td>
                        <td>
                          행사 {poll.eventId} / 세션 {poll.sessionId}
                        </td>
                        <td>{formatDate(poll.startsAt)}</td>
                        <td>{formatDate(poll.endsAt)}</td>
                        <td>
                          <span
                            className={`${styles.status} ${styles[status.toLowerCase()] || ''}`}
                          >
                            {STATUS_LABELS[status] || status}
                          </span>
                        </td>
                        <td>
                          <div className={styles.statusActions}>
                            <button
                              type="button"
                              className={styles.activateButton}
                              disabled={!canActivate || pendingPollId !== null || loading}
                              title={
                                status === 'SCHEDULED' && !canActivate
                                  ? '현재 활성화할 수 없는 투표입니다.'
                                  : undefined
                              }
                              onClick={() => handleStatusChange(poll.id, 'activate')}
                            >
                              {pendingPollId === poll.id ? '처리 중...' : '활성화'}
                            </button>
                            <button
                              type="button"
                              className={styles.closeButton}
                              disabled={!canClose || pendingPollId !== null || loading}
                              onClick={() => handleStatusChange(poll.id, 'close')}
                            >
                              {pendingPollId === poll.id ? '처리 중...' : '비활성화'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
          {!loading && !error && totalPages > 0 && (
            <nav className={styles.pagination} aria-label="투표 목록 페이지">
              <span className={styles.pageInfo}>
                전체 {totalElements}개 · {page + 1} / {totalPages} 페이지
              </span>

              <div className={styles.pageButtons}>
                {/* 첫 페이지 */}
                <button type="button" disabled={page === 0} onClick={() => handlePageChange(0)}>
                  처음
                </button>

                {/* 이전 페이지 */}
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => handlePageChange(page - 1)}
                >
                  이전
                </button>

                {/* 앞쪽에 생략된 페이지가 있으면 ... 표시 */}
                {startPage > 0 && <span aria-hidden="true">…</span>}

                {/* 현재 페이지 기준 최대 5개만 표시 */}
                {visiblePages.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    className={page === pageNumber ? styles.activePage : ''}
                    aria-current={page === pageNumber ? 'page' : undefined}
                    aria-label={`${pageNumber + 1}페이지`}
                    onClick={() => handlePageChange(pageNumber)}
                  >
                    {pageNumber + 1}
                  </button>
                ))}

                {/* 뒤쪽에 생략된 페이지가 있으면 ... 표시 */}
                {startPage + visiblePageCount < totalPages && <span aria-hidden="true">…</span>}

                {/* 다음 페이지 */}
                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() => handlePageChange(page + 1)}
                >
                  다음
                </button>

                {/* 마지막 페이지 */}
                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() => handlePageChange(totalPages - 1)}
                >
                  마지막
                </button>
              </div>
            </nav>
          )}
        </section>

        <p className={styles.footnote}>
          {/* ※ 관리자 ID와 역할 헤더는 로컬 연동 테스트용 임시 값입니다. 실제 서비스에서는 인증된
          사용자 정보로 대체해야 합니다. */}
        </p>
      </main>

      {isCreateOpen && (
        <CreatePollModal onClose={() => setCreateOpen(false)} onCreate={handleCreated} />
      )}
    </div>
  );
}
