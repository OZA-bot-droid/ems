// ADMIN / 09 · 행사 관리 페이지 (주소: /admin/events)
// 공통 레이아웃(사이드바 Header) + 행사 관리 본문(Event/EventManage)을 붙이는 페이지입니다.
// 본문의 [세션 관리] 버튼은 /admin/sessions?eventId=… 로 이동합니다.
import '../Event/event.scss';
import EventManage from '../Event/EventManage.jsx';
import Header from '../../component/Header.jsx';
import DevLogin, { useCurrentUser } from '../../component/DevLogin.jsx';
import './admin-page.scss';

export default function AdminEventPage() {
<<<<<<< HEAD
=======
  const user = useCurrentUser();
  if (user.role !== 'ADMIN') {
    // 로그인 안 했거나 관리자가 아니면 안내 + 개발용 로그인
    return (
      <div className="app-shell">
        <Header role={user.role ?? 'COMMON'} activePage="events" />
        <main className="app-main-content">
          <section className="admin-page">
            <DevLogin />
            <p className="text-sm text-(--ems-muted)">
              {user.id ? '관리자 계정으로 로그인해야 볼 수 있는 화면입니다.' : '로그인이 필요합니다. 관리자 계정으로 로그인하세요.'}
            </p>
          </section>
        </main>
      </div>
    );
  }

>>>>>>> origin/feature/service_dou
  return (
    <div className="app-shell">
      <Header role="ADMIN" activePage="events" />
      <main className="app-main-content">
        <section className="admin-page">
          <DevLogin />
          <header className="admin-page-header">
            <div>
              <h1>행사 관리</h1>
              <p>행사 등록 · 수정 · 상태 관리</p>
            </div>
            <span className="admin-page-role">ADMIN</span>
          </header>
          <EventManage key={user.id} />
        </section>
      </main>
    </div>
  );
}
