// ADMIN / 10 · 세션 관리 페이지 (주소: /admin/sessions, /admin/sessions?eventId=7)
// 공통 레이아웃(사이드바 Header) + 세션 관리 본문(Event/SessionManage)을 붙이는 페이지입니다.
// 화면 내용은 Event/SessionManage.jsx, 디자인은 Event/session-manage.scss에 있습니다.
import '../Event/event.scss';
import './admin-page.scss';
import SessionManage from '../Event/SessionManage.jsx';
import Header from '../../component/Header.jsx';

export default function AdminSessionPage() {
  // ?eventId=7 로 들어오면 그 행사를 먼저 선택 (행사 관리의 [세션 관리] 버튼)
  const eventId = Number(new URLSearchParams(window.location.search).get('eventId')) || null;

  return (
    <div className="app-shell">
      <Header role="ADMIN" activePage="sessions" />
      <main className="app-main-content">
        <section className="admin-page">
          <SessionManage eventId={eventId} />
        </section>
      </main>
    </div>
  );
}
