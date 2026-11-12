import { useEffect, useMemo, useState } from 'react';
import { eventApi, registrationApi } from '../../api.js';
import Header from '../../components/layout/Header.jsx';
import './registration-page.scss';

const STATUS = {
  PENDING: { label: '승인 대기', tone: 'pending' },
  APPROVED: { label: '승인 완료', tone: 'approved' },
  REJECTED: { label: '승인 거부', tone: 'rejected' },
  CANCELLED: { label: '취소됨', tone: 'cancelled' },
};

const FILTER_OPTIONS = [
  ['ALL', '전체'],
  ['PENDING', '승인 대기'],
  ['APPROVED', '승인 완료'],
  ['REJECTED', '승인 거부'],
  ['CANCELLED', '취소됨'],
];

function RegistrationPage() {
  // 화면에 필요한 서버 데이터와 화면 상태
  const [registrations, setRegistrations] = useState([]);
  const [events, setEvents] = useState({});
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [reasonDetail, setReasonDetail] = useState(null);

  // 진입 시 내 신청 내역과 행사명을 불러옵니다.
  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setLoadError('');
      try {
        const [page, eventPage] = await Promise.all([
          registrationApi.mine({ page: 0, size: 100 }),
          eventApi.list({ page: 0, size: 100 }).catch(() => null),
        ]);
        const rows = Array.isArray(page) ? page : (page?.content ?? []);
        const eventRows = eventPage?.content ?? [];
        const pairs = eventRows.map((event) => [event.id, event]);
        if (ignore) return;
        setRegistrations(rows);
        setEvents(Object.fromEntries(pairs));
      } catch (error) {
        if (!ignore) setLoadError(error.message || '신청 내역을 불러오지 못했습니다.');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const filtered = useMemo(
    () => (filter === 'ALL' ? registrations : registrations.filter((row) => row.status === filter)),
    [filter, registrations],
  );

  // 취소 가능한 상태인지 서버가 최종 검증합니다.
  async function cancel(row) {
    if (!window.confirm('참가 신청을 취소할까요?')) return;
    setCancellingId(row.id);
    setActionError('');
    try {
      const updated = await registrationApi.cancel(row.id);
      setRegistrations((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (error) {
      setActionError(error.message || '신청 취소에 실패했습니다.');
    } finally {
      setCancellingId(null);
    }
  }

  // USER 페이지: 분리된 Header 컴포넌트와 제목, 신청 목록을 배치합니다.
  return (
    <div className="app-shell">
      <Header role="USER" activePage="registrations" />

      <main className="app-main-content">
        <header className="registration-heading">
          <div>
            <h1>참가 신청 및 내역</h1>
            <p>신청 · 취소 · 승인 상태 확인</p>
          </div>
          <span className="registration-role">USER</span>
        </header>

        <section className="registration-card" aria-labelledby="registration-list-title">
          <div className="registration-card-heading">
            <h2 id="registration-list-title">나의 참가 신청</h2>
            <div className="registration-filters" aria-label="신청 상태 필터">
              {FILTER_OPTIONS.map(([value, label]) => (
                <button
                  aria-pressed={filter === value}
                  className={`${value === 'PENDING' ? 'pending-filter ' : ''}${value === 'REJECTED' ? 'rejected-filter ' : ''}${filter === value ? 'selected' : ''}`}
                  key={value}
                  onClick={() => setFilter(value)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading && <p className="registration-message">신청 내역을 불러오는 중이에요…</p>}
          {!loading && loadError && (
            <div className="registration-error" role="alert">
              <strong>신청 내역을 불러오지 못했습니다.</strong>
              <p>{loadError}</p>
            </div>
          )}
          {actionError && (
            <p className="registration-action-error" role="alert">
              {actionError}
            </p>
          )}
          {!loading && !loadError && filtered.length === 0 && (
            <p className="registration-message">
              {registrations.length
                ? '이 상태의 신청 내역이 없어요.'
                : '아직 참가 신청 내역이 없어요.'}
            </p>
          )}

          {!loading && !loadError && filtered.length > 0 && (
            <ul className="registration-list">
              {filtered.map((row, index) => {
                const status = STATUS[row.status] ?? { label: row.status, tone: 'pending' };
                const title = events[row.eventId]?.title || `행사 #${row.eventId}`;
                const canCancel = ['PENDING', 'APPROVED'].includes(row.status);
                return (
                  <li
                    className={`registration-row ${index % 2 === 0 ? 'striped' : ''}`}
                    key={row.id}
                  >
                    <div className="registration-event">
                      <strong>{title}</strong>
                      <span className={`registration-status ${status.tone}`}>{status.label}</span>
                      {row.requestedAt && (
                        <time dateTime={row.requestedAt}>
                          {new Date(row.requestedAt).toLocaleDateString('ko-KR')}
                        </time>
                      )}
                    </div>
                    <div className="registration-actions">
                      <button
                        className="registration-link"
                        onClick={() => setDetail(row)}
                        type="button"
                      >
                        상세 보기
                      </button>
                      {canCancel && (
                        <button
                          className="registration-cancel"
                          disabled={cancellingId === row.id}
                          onClick={() => cancel(row)}
                          type="button"
                        >
                          {cancellingId === row.id ? '취소 중…' : '신청 취소'}
                        </button>
                      )}
                      {row.status === 'REJECTED' && (
                        <button
                          className="registration-link"
                          onClick={() => setReasonDetail(row)}
                          type="button"
                        >
                          사유 확인
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="registration-security-note">
            중복 신청 및 타인의 참가 신청 변경은 서버에서 차단됩니다.
          </p>
        </section>
        <footer className="registration-footer">
          EMS · Figma 화면 설계 / 예시 콘텐츠 / 실제 API 연결
        </footer>
      </main>

      {/* 신청 행의 상세 정보 팝업 */}
      {detail && (
        <div
          className="registration-dialog-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDetail(null);
          }}
        >
          <section
            className="registration-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="registration-dialog-title"
          >
            <button
              className="registration-dialog-close"
              onClick={() => setDetail(null)}
              type="button"
              aria-label="닫기"
            >
              ×
            </button>
            <p className="registration-dialog-eyebrow">참가 신청 상세</p>
            <h2 id="registration-dialog-title">
              {events[detail.eventId]?.title || `행사 #${detail.eventId}`}
            </h2>
            <dl>
              <div>
                <dt>상태</dt>
                <dd>{STATUS[detail.status]?.label || detail.status}</dd>
              </div>
              <div>
                <dt>신청 일시</dt>
                <dd>
                  {detail.requestedAt
                    ? new Date(detail.requestedAt).toLocaleString('ko-KR')
                    : '정보 없음'}
                </dd>
              </div>
              <div>
                <dt>결정 일시</dt>
                <dd>
                  {detail.decidedAt
                    ? new Date(detail.decidedAt).toLocaleString('ko-KR')
                    : '아직 결정 전'}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      )}
      {reasonDetail && (
        <div
          className="registration-dialog-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setReasonDetail(null);
          }}
        >
          <section
            className="registration-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="registration-reason-title"
          >
            <button
              className="registration-dialog-close"
              onClick={() => setReasonDetail(null)}
              type="button"
              aria-label="닫기"
            >
              ×
            </button>
            <p className="registration-dialog-eyebrow">참가 신청 결과</p>
            <h2 id="registration-reason-title">승인 거부 사유</h2>
            <dl>
              <div>
                <dt>행사명</dt>
                <dd>{events[reasonDetail.eventId]?.title || '행사 #' + reasonDetail.eventId}</dd>
              </div>
              <div>
                <dt>상태</dt>
                <dd>{STATUS[reasonDetail.status]?.label || reasonDetail.status}</dd>
              </div>
              <div>
                <dt>거부 사유</dt>
                <dd className="registration-reason-content">
                  {reasonDetail.rejectionReason || '등록된 사유가 없습니다.'}
                </dd>
              </div>
              <div>
                <dt>신청 일시</dt>
                <dd>
                  {reasonDetail.requestedAt
                    ? new Date(reasonDetail.requestedAt).toLocaleString('ko-KR')
                    : '정보 없음'}
                </dd>
              </div>
              <div>
                <dt>결정 일시</dt>
                <dd>
                  {reasonDetail.decidedAt
                    ? new Date(reasonDetail.decidedAt).toLocaleString('ko-KR')
                    : '정보 없음'}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      )}
    </div>
  );
}

export default RegistrationPage;
