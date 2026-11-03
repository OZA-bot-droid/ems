// ADMIN / 09 · 행사 관리 페이지 (주소: /admin/events)
// 공통 레이아웃(사이드바 Header) + 행사 관리 본문(Event/EventManage)을 붙이는 페이지입니다.
// 본문의 [세션 관리] 버튼은 /admin/sessions?eventId=… 로 이동합니다.
import { useState } from 'react';
import '../../Event/event.scss';
import EventManage from '../../Event/EventManage.jsx';
import { setDevUser } from '../../api.js';
import Header from '../user/Header.jsx';
import './admin-page.scss';

export default function AdminEventPage() {
  // ⚠️ 개발용: 로그인(JWT) 완성 전까지 관리자 1번으로 요청
  useState(() => setDevUser('ADMIN'));

  return (
    <div className="app-shell">
      <Header role="ADMIN" activePage="events" />
      <main className="app-main-content">
        <section className="admin-page">
          <header className="admin-page-header">
            <div>
              <h1>09 · 행사 관리</h1>
              <p>행사 등록 · 수정 · 상태 관리</p>
            </div>
            <span className="admin-page-role">ADMIN</span>
          </header>
          <EventManage />
        </section>
      </main>
    </div>
  );
}
