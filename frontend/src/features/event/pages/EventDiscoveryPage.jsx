import { mapClassNames } from '../../../styles/classNames.js';
import module0 from '../../../components/layout/header.module.scss';
const cx = (value) => mapClassNames(value, module0);
// USER 행사 찾기 페이지
import { useState } from 'react';
import EventList from '../components/EventList.jsx';
import EventDetail from '../components/EventDetail.jsx';
import Header from '../../../components/layout/LegacyHeader.jsx';
import { useAuth } from '../../member/hooks/useAuth.js';

export default function EventDiscoveryPage() {
  const { role } = useAuth();
  const [selectedId, setSelectedId] = useState(null);

  return (
    <div className={cx('app-shell')}>
      <Header
        role={role ?? 'COMMON'}
        // 관리자 사이드바에서는 [행사 목록]을 강조 (행사 관리는 사이드바의 /admin/events)
        activePage={role === 'ADMIN' ? 'event-list' : 'events'}
      />
      <main className={cx('app-main-content')}>
        {/* 행사 목록과 상세 화면이 가용 너비를 모두 사용 */}
        <div className={cx('w-full min-w-0 px-6 py-9')}>
          {selectedId ? (
            <EventDetail key={selectedId} eventId={selectedId} onBack={() => setSelectedId(null)} />
          ) : (
            <EventList onSelect={setSelectedId} />
          )}
        </div>
      </main>
    </div>
  );
}
