import { useCallback, useEffect, useState } from 'react';
import { registrationApi } from '../../api.js';
import Header from '../../components/layout/Header.jsx';
import '../Event/event.scss';
import './admin-approval.scss';

export default function AdminApprovalPage() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  const loadRegistrations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await registrationApi.adminList({ status: 'PENDING', page: 0, size: 100 });
      setRegistrations(result?.content ?? []);
    } catch (requestError) {
      setError(requestError.message || '신청 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  async function decide(registration) {
    setBusyId(registration.id);
    setError('');
    setNotice('');
    try {
      await registrationApi.approve(registration.id);
      setRegistrations((current) => current.filter((item) => item.id !== registration.id));
      setNotice('회원 ' + registration.userId + '님의 참가 신청을 승인했어요.');
    } catch (requestError) {
      setError(requestError.message || '신청을 처리하지 못했습니다.');
    } finally {
      setBusyId(null);
    }
  }

  async function submitRejection(event) {
    event.preventDefault();
    if (!rejectTarget || !rejectReason.trim()) {
      setRejectError('거부 사유를 입력해 주세요.');
      return;
    }

    setBusyId(rejectTarget.id);
    setRejectError('');
    setError('');
    setNotice('');
    try {
      await registrationApi.reject(rejectTarget.id, rejectReason.trim());
      setRegistrations((current) => current.filter((item) => item.id !== rejectTarget.id));
      setNotice('회원 ' + rejectTarget.userId + '님의 참가 신청을 승인 거부했어요.');
      setRejectTarget(null);
      setRejectReason('');
    } catch (requestError) {
      setRejectError(requestError.message || '신청을 처리하지 못했습니다.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="app-shell">
      <Header role="ADMIN" activePage="approvals" />

      <main className="app-main-content">
        <section className="admin-approval-page" aria-labelledby="admin-approval-title">
          <header className="admin-approval-header">
            <div>
              <h1 id="admin-approval-title">참가 승인</h1>
              <p>내가 주최한 행사의 참가 신청을 확인하고 처리합니다.</p>
            </div>
            <span className="admin-approval-role">ADMIN</span>
          </header>

          <section className="admin-approval-card" aria-labelledby="approval-card-title">
            <div className="admin-approval-card-heading">
              <h2 id="approval-card-title">참가 승인 관리</h2>
              <span className="admin-approval-pending">승인 대기 · {registrations.length}</span>
            </div>

            {notice && (
              <p className="admin-approval-notice" role="status">
                {notice}
                <button onClick={() => setNotice('')} type="button" aria-label="알림 닫기">
                  ×
                </button>
              </p>
            )}

            {error && <p className="admin-approval-error" role="alert">{error}</p>}
            {loading ? (
              <p className="admin-approval-message" role="status">신청 목록을 불러오는 중입니다…</p>
            ) : registrations.length === 0 ? (
              <p className="admin-approval-message">승인 대기 중인 신청이 없습니다.</p>
            ) : (
              <ul className="admin-approval-list" aria-label="승인 대기 신청 목록">
                {registrations.map((registration) => (
                  <li className="admin-approval-row" key={registration.id}>
                    <div className="admin-approval-applicant">
                      <span className="admin-approval-name">회원 {registration.userId}</span>
                      <span className="admin-approval-separator" aria-hidden="true">·</span>
                      <span className="admin-approval-event">{registration.eventTitle}</span>
                    </div>

                    <div className="admin-approval-actions" aria-label={`회원 ${registration.userId} 신청 처리`}>
                      <button
                        className="is-approve"
                        disabled={busyId === registration.id}
                        onClick={() => decide(registration)}
                        type="button"
                      >
                        [승인]
                      </button>
                      <button
                        className="is-reject"
                        disabled={busyId === registration.id}
                        onClick={() => {
                          setRejectTarget(registration);
                          setRejectReason('');
                          setRejectError('');
                        }}
                        type="button"
                      >
                        [거절]
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <p className="admin-approval-policy">
              정원 초과·중복 승인 및 비인가 변경은 Event Service에서 검증합니다.
            </p>
          </section>

          <p className="admin-approval-footer">
            신청자 이름은 Member Service의 신청자 정보 API 연결 후 표시됩니다.
          </p>
        </section>
      </main>

      {rejectTarget && (
        <div
          className="admin-reject-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && busyId !== rejectTarget.id) {
              setRejectTarget(null);
            }
          }}
        >
          <form className="admin-reject-dialog" onSubmit={submitRejection} role="dialog" aria-modal="true" aria-labelledby="admin-reject-title">
            <button
              className="admin-reject-close"
              onClick={() => setRejectTarget(null)}
              type="button"
              disabled={busyId === rejectTarget.id}
              aria-label="닫기"
            >
              ×
            </button>
            <p className="admin-reject-eyebrow">참가 신청 처리</p>
            <h2 id="admin-reject-title">신청을 승인 거부할까요?</h2>
            <p className="admin-reject-description">
              회원 {rejectTarget.userId}님 · {rejectTarget.eventTitle}
              <br />
              작성한 사유는 회원의 신청 내역에서 확인할 수 있어요.
            </p>
            <label htmlFor="admin-rejection-reason">거부 사유</label>
            <textarea
              id="admin-rejection-reason"
              autoFocus
              maxLength={1000}
              rows={5}
              value={rejectReason}
              onChange={(event) => {
                const input = event.currentTarget;
                input.style.height = 'auto';
                input.style.height = input.scrollHeight + 'px';
                setRejectReason(input.value);
              }}
              placeholder="신청을 거부하는 이유를 입력해 주세요."
              required
            />
            <div className="admin-reject-footer">
              <span>{rejectReason.length}/1000자</span>
              <div>
                <button
                  className="is-cancel"
                  onClick={() => setRejectTarget(null)}
                  type="button"
                  disabled={busyId === rejectTarget.id}
                >
                  취소
                </button>
                <button
                  className="is-submit"
                  type="submit"
                  disabled={busyId === rejectTarget.id || !rejectReason.trim()}
                >
                  {busyId === rejectTarget.id ? '처리 중…' : '승인 거부'}
                </button>
              </div>
            </div>
            {rejectError && <p className="admin-approval-error" role="alert">{rejectError}</p>}
          </form>
        </div>
      )}
    </div>
  );
}
