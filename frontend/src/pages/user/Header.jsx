import './header.scss';

export default function Header({ activePage = 'registrations' }) {
  return (
    <header className="app-sidebar-header">
      <a className="registration-brand" href="/" aria-label="EMS 홈">
        <span />
        EMS
      </a>
      <p className="registration-platform">EVENT PLATFORM</p>
      <p className="registration-nav-heading">MY WORKSPACE</p>
      <nav className="registration-nav" aria-label="주 메뉴">
        <a href="/">◦　내 대시보드</a>
        <a
          className={activePage === 'events' ? 'is-active' : ''}
          href="/"
          aria-current={activePage === 'events' ? 'page' : undefined}
        >
          ◦　행사 찾기
        </a>
        <a
          className={activePage === 'registrations' ? 'is-active' : ''}
          href="/registrations"
          aria-current={activePage === 'registrations' ? 'page' : undefined}
        >
          ◦　신청 내역
        </a>
        <a href="/">◦　세미나 참여</a>
        <a href="/">◦　실시간 투표</a>
      </nav>
      <p className="registration-sidebar-note">참가 신청 · 내역</p>
    </header>
  );
}
