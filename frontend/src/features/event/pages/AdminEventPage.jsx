import { mapClassNames } from '../../../styles/classNames.js';
import module0 from '../../../components/layout/header.module.scss';
import module1 from '../styles/admin-page.module.scss';
import module2 from '../styles/admin-approval.module.scss';
import module3 from '../styles/registration-page.module.scss';
import module4 from '../styles/event-manage.module.scss';
import module5 from '../styles/session-manage.module.scss';
const cx = value => mapClassNames(value, module0, module1, module2, module3, module4, module5);
// ADMIN / 09 · 행사 관리 페이지 (주소: /admin/events)
// 공통 레이아웃(사이드바 Header) + 행사 관리 본문(Event/EventManage)을 붙이는 페이지입니다.
// 본문의 [세션 관리] 버튼은 /admin/sessions?eventId=… 로 이동합니다.
import EventManage from '../components/EventManage.jsx';
import Header from '../../../components/layout/Header.jsx';

export default function AdminEventPage() {
  return (
    <div className={cx("app-shell")}>
      <Header role="ADMIN" activePage="events" />
      <main className={cx("app-main-content")}>
        <section className={cx("admin-page")}>
          <header className={cx("admin-page-header")}>
            <div>
              <h1>행사 관리</h1>
              <p>행사 등록 · 수정 · 상태 관리</p>
            </div>
            <span className={cx("admin-page-role")}>ADMIN</span>
          </header>
          <EventManage />
        </section>
      </main>
    </div>
  );
}
