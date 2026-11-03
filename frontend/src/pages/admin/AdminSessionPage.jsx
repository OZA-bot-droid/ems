// ADMIN / 10 · 세션 관리 페이지 (주소: /admin/sessions, /admin/sessions?eventId=7)
// 공통 레이아웃(사이드바 Header) + 세션 관리 본문(Event/SessionManage)을 붙이는 페이지입니다.
// 화면 내용은 Event/SessionManage.jsx, 디자인은 Event/session-manage.scss에 있습니다.
import { useState } from 'react';
import '../../Event/event.scss';
import SessionManage from '../../Event/SessionManage.jsx';
import { setDevUser } from '../../api.js';
import Header from '../user/Header.jsx';

export default function AdminSessionPage() {
  // ⚠️ 개발용: 로그인(JWT) 완성 전까지 관리자 1번으로 요청 (RegistrationPage의 setDevUser('USER')와 같은 방식)
  useState(() => setDevUser('ADMIN'));

  // ?eventId=7 로 들어오면 그 행사를 먼저 선택 (행사 관리의 [세션 관리] 버튼)
  const eventId = Number(new URLSearchParams(window.location.search).get('eventId')) || null;

  return (
    <div className="app-shell">
      <Header role="ADMIN" activePage="sessions" />
      <main className="app-main-content">
        <SessionManage eventId={eventId} />
      </main>
    </div>
  );
}
