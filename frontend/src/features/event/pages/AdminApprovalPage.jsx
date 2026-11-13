import { mapClassNames } from '../../../styles/classNames.js';
import module0 from '../../../components/layout/header.module.scss';
import module1 from '../styles/admin-page.module.scss';
import module2 from '../styles/admin-approval.module.scss';
import module3 from '../styles/registration-page.module.scss';
import module4 from '../styles/event-manage.module.scss';
import module5 from '../styles/session-manage.module.scss';
const cx = value => mapClassNames(value, module0, module1, module2, module3, module4, module5);
import { useCallback, useEffect, useState } from 'react';
import { registrationApi } from '../api/registrationApi.js';
import Header from '../../../components/layout/LegacyHeader.jsx';

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

  async function decide(registration, decision) {
    if (decision === 'reject') {
      setRejectTarget(registration);
      setRejectReason('');
      setRejectError('');
      return;
    }

    if (decision === 'approve') {
      setBusyId(registration.id);
      setError('');
      setNotice('');
      try {
        await registrationApi.approve(registration.id);
        setRegistrations((current) => current.filter((item) => item.id !== registration.id));
        setNotice(`회원 ${registration.userId}님의 참가 신청을 승인했어요.`);
      } catch (requestError) {
        setError(requestError.message || '신청을 처리하지 못했습니다.');
      } finally {
        setBusyId(null);
      }
    }
  }

  async function submitRejection(event) {
    event.preventDefault();
    const reason = rejectReason.trim();
    if (!rejectTarget || !reason) {
      setRejectError('거부 사유를 입력해 주세요.');
      return;
    }

    setBusyId(rejectTarget.id);
    setRejectError('');
    setError('');
    setNotice('');
    try {
      await registrationApi.reject(rejectTarget.id, reason);
      setRegistrations((current) => current.filter((item) => item.id !== rejectTarget.id));
      setNotice(`회원 ${rejectTarget.userId}님의 참가 신청을 거절했어요.`);
      setRejectTarget(null);
      setRejectReason('');
    } catch (requestError) {
      setRejectError(requestError.message || '신청을 거절하지 못했습니다.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className={cx("app-shell")}>
      <Header role="ADMIN" activePage="approvals" />

      <main className={cx("app-main-content")}>
        <section className={cx("admin-approval-page")} aria-labelledby="admin-approval-title">
          <header className={cx("admin-approval-header")}>
            <div>
              <h1 id="admin-approval-title">참가 승인</h1>
              <p>내가 주최한 행사의 참가 신청을 확인하고 처리합니다.</p>
            </div>
            <span className={cx("admin-approval-role")}>ADMIN</span>
          </header>

          <section className={cx("admin-approval-card")} aria-labelledby="approval-card-title">
            <div className={cx("admin-approval-card-heading")}>
              <h2 id="approval-card-title">참가 승인 관리</h2>
              <span className={cx("admin-approval-pending")}>승인 대기 · {registrations.length}</span>
            </div>

            {notice && (
              <p className={cx("admin-approval-notice")} role="status">
                {notice}
                <button onClick={() => setNotice('')} type="button" aria-label="알림 닫기">
                  ×
                </button>
              </p>
            )}

            {error && <p className={cx("admin-approval-error")} role="alert">{error}</p>}
            {loading ? (
              <p className={cx("admin-approval-message")} role="status">신청 목록을 불러오는 중입니다…</p>
            ) : registrations.length === 0 ? (
              <p className={cx("admin-approval-message")}>승인 대기 중인 신청이 없습니다.</p>
            ) : (
              <ul className={cx("admin-approval-list")} aria-label="승인 대기 신청 목록">
                {registrations.map((registration) => (
                  <li className={cx("admin-approval-row")} key={registration.id}>
                    <div className={cx("admin-approval-applicant")}>
                      <span className={cx("admin-approval-name")}>회원 {registration.userId}</span>
                      <span className={cx("admin-approval-separator")} aria-hidden="true">·</span>
                      <span className={cx("admin-approval-event")}>{registration.eventTitle}</span>
                    </div>

                    <div className={cx("admin-approval-actions")} aria-label={`회원 ${registration.userId} 신청 처리`}>
                      <button
                        className={cx("is-approve")}
                        disabled={busyId === registration.id}
                        onClick={() => decide(registration, 'approve')}
                        type="button"
                      >
                        [승인]
                      </button>
                      <button
                        className={cx("is-reject")}
                        disabled={busyId === registration.id}
                        onClick={() => decide(registration, 'reject')}
                        type="button"
                      >
                        [거절]
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </section>
      </main>

      {rejectTarget && (
        <div
          className={cx("admin-reject-backdrop")}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && busyId !== rejectTarget.id) {
              setRejectTarget(null);
            }
          }}
        >
          <form
            className={cx("admin-reject-dialog")}
            onSubmit={submitRejection}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-reject-title"
          >
            <button
              className={cx("admin-reject-close")}
              onClick={() => setRejectTarget(null)}
              type="button"
              disabled={busyId === rejectTarget.id}
              aria-label="닫기"
            >
              ×
            </button>
            <p className={cx("admin-reject-eyebrow")}>참가 신청 처리</p>
            <h2 id="admin-reject-title">신청을 승인 거부할까요?</h2>
            <p className={cx("admin-reject-description")}>
              회원 {rejectTarget.userId}님 · {rejectTarget.eventTitle}
              <br />
              작성한 사유는 회원의 신청 내역에서 확인할 수 있어요.
            </p>
            <label className={cx("admin-reject-label")} htmlFor="admin-rejection-reason">거부 사유</label>
            <textarea
              className={cx("admin-reject-textarea")}
              id="admin-rejection-reason"
              autoFocus
              maxLength={1000}
              rows={5}
              value={rejectReason}
              onChange={(event) => setRejectReason(event.currentTarget.value)}
              placeholder="신청을 거부하는 이유를 입력해 주세요."
              required
            />
            <div className={cx("admin-reject-footer")}>
              <span>{rejectReason.length}/1000자</span>
              <div className={cx("admin-reject-buttons")}>
                <button
                  className={cx("admin-reject-cancel")}
                  onClick={() => setRejectTarget(null)}
                  type="button"
                  disabled={busyId === rejectTarget.id}
                >취소</button>
                <button
                  className={cx("admin-reject-submit")}
                  type="submit"
                  disabled={busyId === rejectTarget.id || !rejectReason.trim()}
                >
                  {busyId === rejectTarget.id ? '처리 중…' : '승인 거부'}
                </button>
              </div>
            </div>
            {rejectError && <p className={cx("admin-approval-error")} role="alert">{rejectError}</p>}
          </form>
        </div>
      )}
    </div>
  );
}
