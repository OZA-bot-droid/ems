import { mapClassNames } from '../../../styles/classNames.js';
import module0 from '../../../components/layout/header.module.scss';
import module1 from '../styles/admin-page.module.scss';
import module2 from '../styles/admin-approval.module.scss';
import module3 from '../styles/registration-page.module.scss';
import module4 from '../styles/event-manage.module.scss';
import module5 from '../styles/session-manage.module.scss';
const cx = value => mapClassNames(value, module0, module1, module2, module3, module4, module5);
// ADMIN / 10 · 세션 관리 페이지 (주소: /admin/sessions, /admin/sessions?eventId=7)
// 공통 레이아웃(사이드바 Header) + 세션 관리 본문(Event/SessionManage)을 붙이는 페이지입니다.
// 화면 내용은 Event/SessionManage.jsx, 디자인은 Event/session-manage.scss에 있습니다.
import { useSearchParams } from 'react-router-dom';
import SessionManage from '../components/SessionManage.jsx';
import Header from '../../../components/layout/LegacyHeader.jsx';

export default function AdminSessionPage() {
  // ?eventId=7 로 들어오면 그 행사를 먼저 선택 (행사 관리의 [세션 관리] 버튼)
  // useSearchParams: 화면 안에서 주소만 바뀌어도(새로고침 없이) 다시 읽어 준다
  const [searchParams] = useSearchParams();
  const eventId = Number(searchParams.get('eventId')) || null;

  return (
    <div className={cx("app-shell")}>
      <Header role="ADMIN" activePage="sessions" />
      <main className={cx("app-main-content")}>
        <section className={cx("admin-page")}>
          <SessionManage eventId={eventId} />
        </section>
      </main>
    </div>
  );
}
