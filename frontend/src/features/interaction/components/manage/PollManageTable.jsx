import PollPagination from './PollPagination.jsx';
import { panel, btn, closeBtn } from './pollManageStyles.js';
import styles from '../../styles/PollManage.module.scss';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// 관리자 Poll 목록, 상태 조작 버튼, 페이징을 표시하는 컴포넌트
export default function PollManageTable({
  onCreateClick,
  eventFilter,
  sessionFilter,
  loading,
  rows,
  events = [],
  sessions = [],
  busy,
  page,
  pages,
  onPageChange,
  onChangeStatus,
  onViewResults,
}) {
  // 태블릿·모바일에서 펼쳐진 투표 ID
  const [expandedPollId, setExpandedPollId] = useState(null);

  // 같은 투표를 다시 누르면 접히고,
  // 다른 투표를 누르면 해당 투표가 펼쳐진다.
  const togglePoll = (pollId) => {
    setExpandedPollId((current) => (current === pollId ? null : pollId));
  };

  useEffect(() => {
    setExpandedPollId(null);
  }, [page]);

  return (
    <section className={panel}>
      <div className={styles.tableHeader}>
        <h2 className="font-bold">
          등록된 투표 {eventFilter && '(행사 ' + eventFilter + ')'}{' '}
          {sessionFilter && '(세션 ' + sessionFilter + ')'}
        </h2>

        <div className={styles.headerActions}>
          <Link to="/polls/vote" className={styles.votePageLink}>
            실시간 투표
          </Link>

          <button type="button" className={btn} onClick={onCreateClick}>
            ＋ 새 투표
          </button>
        </div>
      </div>

      {/* 로딩 → 빈 목록 → 투표 테이블 순으로 조건부 렌더링 */}
      {loading ? (
        <p>불러오는 중...</p>
      ) : rows.length === 0 ? (
        <p>표시할 투표가 없습니다.</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.pollTable}>
            <thead>
              <tr>
                {['투표', '행사 / 세션', '시작', '종료', '상태', '관리', '결과 확인'].map((x) => (
                  <th key={x} className="border-b p-3">
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* p: 조회된 투표 한 건, canActivate/canClose는 API 응답의 버튼 활성화 여부 */}
              {rows.map((p) => (
                <tr
                  key={p.id}
                  className={`${styles.pollRow} ${
                    expandedPollId === p.id ? styles.isExpanded : ''
                  }`}
                >
                  <td data-label="투표" className="p-3 font-semibold">
                    {/* PC: 기존 투표 제목 */}
                    <span className={styles.desktopPollTitle}>{p.title}</span>

                    {/* 태블릿·모바일: 클릭 가능한 제목 */}
                    <button
                      type="button"
                      className={styles.mobilePollToggle}
                      onClick={() => togglePoll(p.id)}
                      aria-expanded={expandedPollId === p.id}
                      aria-label={`${p.title} 상세 정보 ${
                        expandedPollId === p.id ? '접기' : '펼치기'
                      }`}
                    >
                      <span>{p.title}</span>

                      <span
                        className={`${styles.pollToggleIcon} ${
                          expandedPollId === p.id ? styles.pollToggleIconOpen : ''
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  </td>

                  <td data-label="행사 / 세션" className="p-3">
                    {events.find((event) => String(event.id) === String(p.eventId))?.title ??
                      p.eventId}
                    {' / '}
                    {sessions.find(
                      (session) =>
                        String(session.id) === String(p.sessionId) &&
                        String(session.eventId) === String(p.eventId),
                    )?.title ?? p.sessionId}
                  </td>

                  <td data-label="시작" className="p-3">
                    {new Date(p.startsAt).toLocaleString('ko-KR')}
                  </td>

                  <td data-label="종료" className="p-3">
                    {new Date(p.endsAt).toLocaleString('ko-KR')}
                  </td>

                  <td data-label="상태">
                    <span
                      className={`${styles.statusBadge} ${
                        p.status === 'ACTIVE'
                          ? styles.statusActive
                          : p.status === 'CLOSED'
                            ? styles.statusClosed
                            : styles.statusScheduled
                      }`}
                    >
                      {p.status === 'ACTIVE' ? '진행 중' : p.status === 'CLOSED' ? '종료' : '예정'}
                    </span>
                  </td>

                  <td data-label="관리">
                    <div className={styles.actionGroup}>
                      <button
                        type="button"
                        className={`${styles.actionButton} ${styles.activateButton}`}
                        disabled={busy || !p.canActivate}
                        onClick={() => onChangeStatus(p.id, 'activate')}
                      >
                        시작
                      </button>

                      <button
                        type="button"
                        className={`${styles.actionButton} ${styles.closeButton}`}
                        disabled={busy || !p.canClose}
                        onClick={() => onChangeStatus(p.id, 'close')}
                      >
                        종료
                      </button>
                    </div>
                  </td>

                  <td data-label="결과 확인">
                    <button
                      type="button"
                      className={styles.resultButton}
                      onClick={() =>
                        onViewResults(p.id, {
                          eventId: p.eventId,
                          sessionId: p.sessionId,
                          eventName:
                            events.find((event) => String(event.id) === String(p.eventId))?.title ||
                            '',
                          sessionName:
                            sessions.find(
                              (session) =>
                                String(session.id) === String(p.sessionId) &&
                                String(session.eventId) === String(p.eventId),
                            )?.title || '',
                        })
                      }
                    >
                      확인
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PollPagination page={page} pages={pages} onPageChange={onPageChange} />
    </section>
  );
}
