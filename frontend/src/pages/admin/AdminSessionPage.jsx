// ADMIN / 10 · 세션 관리 페이지 (주소: /admin/sessions, /admin/sessions?eventId=7)
// 공통 레이아웃(사이드바 Header) + 세션 관리 본문(Event/SessionManage)을 붙이는 페이지입니다.
// 화면 내용은 Event/SessionManage.jsx, 디자인은 Event/session-manage.scss에 있습니다.
import '../Event/event.scss';
import './admin-page.scss';
import SessionManage from '../Event/SessionManage.jsx';
import Header from '../../component/Header.jsx';
import DevLogin, { useCurrentUser } from '../../component/DevLogin.jsx';

export default function AdminSessionPage() {
<<<<<<< HEAD
=======
  const user = useCurrentUser();
  if (user.role !== 'ADMIN') {
    // 로그인 안 했거나 관리자가 아니면 안내 + 개발용 로그인
    return (
      <div className="app-shell">
        <Header role={user.role ?? 'COMMON'} activePage="sessions" />
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
  // ?eventId=7 로 들어오면 그 행사를 먼저 선택 (행사 관리의 [세션 관리] 버튼)
  const eventId = Number(new URLSearchParams(window.location.search).get('eventId')) || null;

  return (
    <div className="app-shell">
      <Header role="ADMIN" activePage="sessions" />
      <main className="app-main-content">
        <section className="admin-page">
          <DevLogin />
          <SessionManage key={user.id} eventId={eventId} />
        </section>
      </main>
    </div>
  );
}
