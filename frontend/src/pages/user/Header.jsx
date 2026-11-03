import './header.scss';

const MENUS = {
  COMMON: {
    heading: 'EXPLORE',
    items: [
      { id: 'events', label: '행사 목록', href: '/events' },
      { id: 'event-detail', label: '행사 상세', href: '/events' },
      { id: 'login', label: '로그인', href: '/login' },
      { id: 'signup', label: '회원가입', href: '/signup' },
    ],
  },
  USER: {
    heading: 'MY WORKSPACE',
    items: [
      { id: 'dashboard', label: '내 대시보드', href: '/' },
      { id: 'events', label: '행사 찾기', href: '/events' },
      { id: 'registrations', label: '신청 내역', href: '/registrations' },
      { id: 'seminars', label: '세미나 참여', href: '#' },
      { id: 'votes', label: '실시간 투표', href: '#' },
    ],
  },
  // href: null = 아직 백엔드 API가 없어 화면을 연결하지 않은 메뉴 ("준비 중"으로 표시)
  ADMIN: {
    heading: 'ADMIN WORKSPACE',
    items: [
      { id: 'dashboard', label: '운영 대시보드', href: null }, // 통계·집계 API 없음
      { id: 'events', label: '행사 관리', href: '/admin/events' }, // Event Service /events
      { id: 'sessions', label: '세션 관리', href: '/admin/sessions' }, // /events/{id}/sessions
      { id: 'approvals', label: '참가 승인', href: null }, // 승인·거절 API는 있으나 관리자용 신청 목록 조회 API 없음
      { id: 'votes', label: '투표 관리', href: null }, // Interaction Service 미구현
      { id: 'statistics', label: '기본 통계', href: null }, // 통계 API 없음
    ],
  },
};

function RoleHeader({ role, activePage }) {
  const menu = MENUS[role];

  return (
    <header className="app-sidebar-header" data-role={role}>
      <a className="registration-brand" href="/" aria-label="EMS 홈">
        <span />
        EMS
      </a>
      <p className="registration-platform">EVENT PLATFORM</p>
      <p className="registration-nav-heading">{menu.heading}</p>
      <nav className="registration-nav" aria-label={`${role} 주 메뉴`}>
        {menu.items.map(({ id, label, href }) =>
          href === null ? (
            <span className="is-disabled" aria-disabled="true" key={id} title="백엔드 API 연결 전">
              ◦　 {label}
              <small>준비 중</small>
            </span>
          ) : (
            <a
              aria-current={activePage === id ? 'page' : undefined}
              className={activePage === id ? 'is-active' : ''}
              href={href}
              key={id}
            >
              ◦　 {label}
            </a>
          ),
        )}
      </nav>
      <p className="registration-sidebar-note">시안 / API 연결 전</p>
    </header>
  );
}

export default function Header({ role = 'COMMON', activePage = 'events' }) {
  if (role === 'ADMIN') return <RoleHeader role="ADMIN" activePage={activePage} />;
  if (role === 'USER') return <RoleHeader role="USER" activePage={activePage} />;
  return <RoleHeader role="COMMON" activePage={activePage} />;
}
