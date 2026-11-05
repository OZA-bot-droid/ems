// USER 행사 찾기 페이지
import { useState } from 'react';
import '../Event/event.scss';
import EventList from '../Event/EventList.jsx';
import EventDetail from '../Event/EventDetail.jsx';
import Header from '../../component/Header.jsx';
import DevLogin, { useCurrentUser } from '../../component/DevLogin.jsx';

export default function EventDiscoveryPage() {
  const user = useCurrentUser(); // 로그인한 계정 (토큰의 sub·role)
  const role = user.role; // 'ADMIN' | 'USER' | null(손님)
  const [selectedId, setSelectedId] = useState(null);

  return (
    <div className="app-shell">
      <Header
        role={role ?? 'COMMON'}
        // 관리자 사이드바에서는 [행사 목록]을 강조 (행사 관리는 사이드바의 /admin/events)
        activePage={role === 'ADMIN' ? 'event-list' : 'events'}
      />
      <main className="app-main-content">
        <div className="mx-auto max-w-[840px] px-6 py-9">
          {/* 개발용 로그인 (정식 로그인 화면이 들어오면 교체) */}
          <DevLogin />

          {/* 화면 전환: 선택한 행사가 있으면 상세, 없으면 목록 */}
          {selectedId ? (
            <EventDetail
              key={`${user.id}-${selectedId}`}
              eventId={selectedId}
              onBack={() => setSelectedId(null)}
            />
          ) : (
            <EventList key={user.id ?? 'guest'} onSelect={setSelectedId} />
          )}
        </div>
      </main>
    </div>
  );
}
