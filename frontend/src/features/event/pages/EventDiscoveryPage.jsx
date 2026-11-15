import { mapClassNames } from '../../../styles/classNames.js';
import module0 from '../../../components/layout/header.module.scss';
import module1 from '../styles/admin-page.module.scss'; // 행사 관리와 같은 페이지 머리 틀
const cx = (value) => mapClassNames(value, module0, module1);
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
        {/* 행사 관리(AdminEventPage)와 같은 틀: admin-page > admin-page-header > 본문 */}
        <section className={cx('admin-page')} aria-label="행사 목록">
          {/* 상세를 볼 때는 상세 화면이 자기 제목을 그리므로 페이지 머리를 숨김 */}
          {!selectedId && (
            <header className={cx('admin-page-header')}>
              <div>
                <h1>행사 목록</h1>
                <p>이벤트 탐색 · 검색 및 필터</p>
              </div>
              {role === 'ADMIN' && <span className={cx('admin-page-role')}>ADMIN</span>}
            </header>
          )}
          {selectedId ? (
            <EventDetail key={selectedId} eventId={selectedId} onBack={() => setSelectedId(null)} />
          ) : (
            <EventList onSelect={setSelectedId} />
          )}
        </section>
      </main>
    </div>
  );
}
