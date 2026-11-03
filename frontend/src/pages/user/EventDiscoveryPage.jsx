// USER 행사 찾기 페이지
import { useState } from 'react';
import '../../Event/event.scss';
import EventList from '../../Event/EventList.jsx';
import EventDetail from '../../Event/EventDetail.jsx';
import EventManage from '../../Event/EventManage.jsx';
import { getDevUser, setDevUser } from '../../api.js';
import Header from './Header.jsx';

export default function EventDiscoveryPage() {
  const [role, setRole] = useState(getDevUser().role);
  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState('browse'); // 'browse'=둘러보기, 'manage'=행사 관리(관리자)

  // 개발용: 관리자/일반 사용자를 바꿔 가며 화면 확인 (로그인 완성 후 삭제)
  const changeRole = (next) => {
    setDevUser(next);
    setRole(next);
    if (next !== 'ADMIN') setView('browse'); // 일반 사용자는 관리 화면 못 봄
  };

  return (
    <div className="app-shell">
      <Header role={role} activePage="events" />
      <main className="app-main-content">
        <div
          className={
            view === 'manage'
              ? 'w-full px-8 py-9'
              : 'mx-auto max-w-[840px] px-6 py-9'
          }
        >
          <div className="mb-6 flex items-center gap-2 text-xs">
            <span className="text-(--ems-muted)">개발용 사용자</span>
            {['ADMIN', 'USER'].map((r) => (
              <button
                key={r}
                onClick={() => changeRole(r)}
                className={`rounded-[6px] px-2.5 py-1 font-semibold ${
                  role === r ? 'bg-(--ems-green) text-white' : 'bg-(--ems-surface) text-(--ems-ink)'
                }`}
              >
                {r === 'ADMIN' ? '관리자' : '일반'}
              </button>
            ))}
          </div>

          {/* 관리자에게만 보이는 탭: 둘러보기 / 행사 관리 */}
          {role === 'ADMIN' && (
            <div className="mb-6 flex gap-2 text-[13px] font-semibold">
              {[
                ['browse', '행사 둘러보기'],
                ['manage', '행사 관리'],
              ].map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => {
                    setView(v);
                    setSelectedId(null);
                  }}
                  className={`rounded-[9px] px-4 py-2 ${
                    view === v ? 'bg-(--ems-ink) text-white' : 'bg-(--ems-surface) text-(--ems-ink)'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {view === 'manage' ? (
            <EventManage />
          ) : /* 화면 전환: 선택한 행사가 있으면 상세, 없으면 목록 */
          selectedId ? (
            <EventDetail
              key={`${role}-${selectedId}`}
              eventId={selectedId}
              onBack={() => setSelectedId(null)}
            />
          ) : (
            <EventList key={role} onSelect={setSelectedId} />
          )}
        </div>
      </main>
    </div>
  );
}
