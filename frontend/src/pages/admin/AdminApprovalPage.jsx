import { useEffect, useState } from 'react';
import { setDevUser } from '../../api.js';
import Header from '../../component/Header.jsx';
import '../Event/event.scss';
import './admin-approval.scss';

const SAMPLE_REGISTRATIONS = [
  { id: 1, name: '김하늘', eventTitle: '클라우드 네이티브 컨퍼런스', status: 'PENDING' },
  { id: 2, name: '이서준', eventTitle: '실시간 웹 기술 세미나', status: 'PENDING' },
  { id: 3, name: '박지민', eventTitle: '마이크로서비스 실습 워크숍', status: 'PENDING' },
  { id: 4, name: '최유진', eventTitle: '클라우드 네이티브 컨퍼런스', status: 'PENDING' },
];

const STATUS_LABEL = {
  APPROVED: '승인 완료',
  REJECTED: '거절 완료',
};

export default function AdminApprovalPage() {
  useEffect(() => setDevUser('ADMIN'), []);

  const [registrations, setRegistrations] = useState(SAMPLE_REGISTRATIONS);
  const [notice, setNotice] = useState('');
  const pendingCount = registrations.filter((item) => item.status === 'PENDING').length;

  function updateSampleStatus(registration, status) {
    setRegistrations((current) =>
      current.map((item) => (item.id === registration.id ? { ...item, status } : item)),
    );
    setNotice(
      `${registration.name}님의 신청을 ${STATUS_LABEL[status]} 처리했어요. 예시 화면에만 반영됐습니다.`,
    );
  }

  return (
    <div className="app-shell">
      <Header role="ADMIN" activePage="approvals" />

      <main className="app-main-content">
        <section className="admin-approval-page" aria-labelledby="admin-approval-title">
          <header className="admin-approval-header">
            <div>
              <h1 id="admin-approval-title">11 · 참가 승인</h1>
              <p>PENDING / APPROVED / REJECTED</p>
            </div>
            <span className="admin-approval-role">ADMIN</span>
          </header>

          <section className="admin-approval-card" aria-labelledby="approval-card-title">
            <div className="admin-approval-card-heading">
              <h2 id="approval-card-title">참가 승인 관리</h2>
              <span className="admin-approval-pending">승인 대기{pendingCount > 0 ? ` · ${pendingCount}` : ''}</span>
            </div>

            {notice && (
              <p className="admin-approval-notice" role="status">
                {notice}
                <button onClick={() => setNotice('')} type="button" aria-label="알림 닫기">
                  ×
                </button>
              </p>
            )}

            <ul className="admin-approval-list" aria-label="참가 신청 예시 목록">
              {registrations.map((registration, index) => (
                <li className="admin-approval-row" key={registration.id}>
                  <div className="admin-approval-applicant">
                    <span className="admin-approval-name">{registration.name}</span>
                    <span className="admin-approval-separator" aria-hidden="true">·</span>
                    <span className="admin-approval-event">{registration.eventTitle}</span>
                  </div>

                  {registration.status === 'PENDING' ? (
                    <div className="admin-approval-actions" aria-label={`${registration.name} 신청 처리`}>
                      <button
                        className="is-approve"
                        onClick={() => updateSampleStatus(registration, 'APPROVED')}
                        type="button"
                      >
                        승인
                      </button>
                      <button
                        className="is-reject"
                        onClick={() => updateSampleStatus(registration, 'REJECTED')}
                        type="button"
                      >
                        거절
                      </button>
                    </div>
                  ) : (
                    <span className={`admin-approval-status is-${registration.status.toLowerCase()}`}>
                      {STATUS_LABEL[registration.status]}
                    </span>
                  )}
                </li>
              ))}
            </ul>

            <p className="admin-approval-policy">
              정원 초과·중복 승인 및 비인가 변경은 Event Service에서 검증
            </p>
          </section>

          <p className="admin-approval-footer">
            EMS · Figma 화면 설계 / 예시 콘텐츠 / 실제 API 미연결
          </p>
        </section>
      </main>
    </div>
  );
}
