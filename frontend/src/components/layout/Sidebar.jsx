// 파일 기능: 현재 위치에 맞는 사이드바 메뉴를 표시합니다.

import { useState } from 'react';
import styles from './Sidebar.module.scss';

// 변수 역할: 사이드바에 표시할 메뉴 항목
const NAVIGATION = [
  '내 대시보드',
  '행사 찾기',
  '신청 내역',
  '세미나 참여',
  '실시간 투표',
  '투표 관리',
];

// 변수 역할: 각 메뉴에 연결되는 경로
const ROUTES = {
  '실시간 투표': '/polls/vote',
  '투표 관리': '/polls/manage',
};

// 함수 역할: 현재 주소에 맞는 사이드바를 렌더링합니다.
export default function Sidebar() {
  // 변수 역할: 현재 화면의 URL 경로
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/';

  return (
    <aside className={styles.sidebar} aria-label="사용자 메뉴">
      <a className={styles.brand} href="/" aria-label="EMS 홈">
        <span className={styles.brandAccent} />
        <strong>EMS</strong>
      </a>
      <p className={styles.brandCaption}>EVENT PLATFORM</p>
      <p className={styles.sidebarHeading}>MY WORKSPACE</p>
      <nav aria-label="메뉴" className={styles.nav}>
        {NAVIGATION.map((label) => {
          const href = ROUTES[label];
          if (!href) {
            return (
              <div key={label} className={styles.navItem}>
                <span aria-hidden="true">◦</span>
                <span className={styles.navText}>{label}</span>
              </div>
            );
          }
          const active = currentPath === href;
          return (
            <a
              key={label}
              href={href}
              className={`${styles.navItem} ${active ? styles.active : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <span aria-hidden="true">◦</span>
              <span className={styles.navText}>{label}</span>
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
