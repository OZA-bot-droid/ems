import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePollManagement } from '../hooks/manage/usePollManagement.js';
import { usePollCreate } from '../hooks/manage/usePollCreate.js';
import PollManageHeader from '../components/manage/PollManageHeader.jsx';
import PollCreateForm from '../components/manage/PollCreateForm.jsx';
import PollManageTable from '../components/manage/PollManageTable.jsx';
import Header from '../../../components/layout/LegacyHeader.jsx';
import module0 from '../../../components/layout/header.module.scss';
import { mapClassNames } from '../../../styles/classNames.js';
import styles from '../styles/PollManage.module.scss';
import { usePollManagementRealtime } from '../hooks/manage/usePollManagementRealtime.js';

const cx = (value) => mapClassNames(value, module0);

// 페이지는 URL 필터와 공통 레이아웃·컴포넌트 조립만 담당한다.
export default function PollManagePage() {
  const [params] = useSearchParams();
  const eventFilter = params.get('eventId') || '';
  const sessionFilter = params.get('sessionId') || '';
  const mutationLock = useRef(false);

  const management = usePollManagement(eventFilter, sessionFilter, mutationLock);

  const creation = usePollCreate(eventFilter, sessionFilter, management.refresh, mutationLock);

  const busy = management.busy || creation.busy;

  // 관리자 투표 목록 실시간 상태 변경 감지
  const { socketConnected } = usePollManagementRealtime({
    rows: management.rows,
    refresh: management.refresh,
  });

  // 투표 생성 모달 열기
  const openCreateModal = () => {
    if (busy) return;
    creation.setOpen(true);
  };

  // 투표 생성 모달 닫기
  const closeCreateModal = () => {
    if (busy) return;
    creation.setOpen(false);
  };

  // Esc 키로 모달 닫기
  useEffect(() => {
    if (!creation.open) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) {
        creation.setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [creation.open, busy, creation.setOpen]);

  return (
    <div className={cx('app-shell')}>
      {/* 투표 생성 모달 */}
      {creation.open && (
        <div
          className={styles.modalOverlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCreateModal();
            }
          }}
        >
          <section
            className={styles.modalContent}
            role="dialog"
            aria-modal="true"
            aria-labelledby="poll-create-title"
          >
            {/* 모달 헤더 */}
            <div className={styles.modalHeader}>
              <div>
                <h2 id="poll-create-title" className={styles.modalTitle}>
                  새 투표 생성
                </h2>

                <p className={styles.modalDescription}>행사와 세션을 선택하고 투표를 등록하세요.</p>
              </div>

              <button
                type="button"
                className={styles.modalClose}
                disabled={busy}
                onClick={closeCreateModal}
                aria-label="투표 생성 창 닫기"
              >
                ×
              </button>
            </div>

            {/* 모달 본문 */}
            <div className={styles.modalBody}>
              {creation.error && (
                <p className={styles.error} role="alert">
                  {creation.error}
                </p>
              )}

              <PollCreateForm
                form={creation.form}
                setForm={creation.setForm}
                update={creation.update}
                events={creation.events}
                sessions={creation.sessions}
                busy={busy}
                onSubmit={creation.create}
                onCancel={closeCreateModal}
              />
            </div>
          </section>
        </div>
      )}
      <Header role="ADMIN" activePage="votes" />
      {/* 투표 관리자 본문: 공통 스크롤·너비 규격 적용 */}
      <main className={cx('app-main-content w-full min-w-0 space-y-5 text-slate-800')}>
        <PollManageHeader onCreateClick={() => creation.setOpen((v) => !v)} />
        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-red-700" role="alert">
            {error}
          </p>
        )}

        {/* 등록된 투표 목록 */}
        <section className={styles.listCard}>
          <PollManageTable
            eventFilter={eventFilter}
            sessionFilter={sessionFilter}
            loading={management.loading}
            rows={management.rows}
            busy={busy}
            page={management.page}
            pages={management.pages}
            onPageChange={management.setPage}
            onChangeStatus={management.change}
            onViewResults={management.goToResults}
          />
        </section>

        <p className={styles.notice}>서버에서 Event 소유권과 실제 참가 승인 여부를 검증합니다.</p>
      </main>
    </div>
  );
}
