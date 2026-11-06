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
    setBusyId(registration.id);
    setError('');
    setNotice('');
    try {
      if (decision === 'approve') {
        await registrationApi.approve(registration.id);
      } else {
        const reason = window.prompt('참가 거절 사유 (최대 1000자)');
        if (!reason?.trim()) return;
        if (reason.trim().length > 1000) throw new Error('거절 사유는 최대 1000자입니다.');
        await registrationApi.reject(registration.id, reason.trim());
      }
      setRegistrations((current) => current.filter((item) => item.id !== registration.id));
      setNotice(`회원 ${registration.userId}님의 참가 신청을 ${decision === 'approve' ? '승인' : '거절'}했어요.`);
    } catch (requestError) {
      setError(requestError.message || '신청을 처리하지 못했습니다.');
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

            <p className={cx("admin-approval-policy")}>
              정원 초과·중복 승인 및 비인가 변경은 Event Service에서 검증합니다.
            </p>
          </section>

          <p className={cx("admin-approval-footer")}>
            신청자 이름은 Member Service의 신청자 정보 API 연결 후 표시됩니다.
          </p>
        </section>
      </main>
    </div>
  );
}
