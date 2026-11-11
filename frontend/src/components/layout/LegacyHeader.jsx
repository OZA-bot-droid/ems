import { mapClassNames } from '../../styles/classNames.js';
import module0 from './header.module.scss';
const cx = (value) => mapClassNames(value, module0);

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
      { id: 'votes', label: '실시간 투표', href: '/polls/vote' },
    ],
  },
  // href: null = 아직 백엔드 API가 없어 화면을 연결하지 않은 메뉴 (보이기만 하고 누를 수 없음)
  ADMIN: {
    heading: 'ADMIN WORKSPACE',
    items: [
      { id: 'dashboard', label: '운영 대시보드', href: null }, // 통계·집계 API 없음
      { id: 'event-list', label: '행사 목록', href: '/events' }, // 사용자와 같은 행사 목록 (관리자는 상단에 [행사 관리] 탭도 보임)
      { id: 'events', label: '행사 관리', href: '/admin/events' }, // Event Service /events
      { id: 'sessions', label: '세션 관리', href: '/admin/sessions' }, // /events/{id}/sessions
      { id: 'approvals', label: '참가 승인', href: '/admin/approvals' }, // ADMIN / 11 참가 승인
      { id: 'votes', label: '투표 관리', href: '/admin/polls' }, // Interaction Service 미구현
      { id: 'statistics', label: '기본 통계', href: null }, // 통계 API 없음
    ],
  },
};

function RoleHeader({ role, activePage }) {
  const menu = MENUS[role];

  return (
    <header className={cx('app-sidebar-header')} data-role={role}>
      <a className={cx('registration-brand')} href="/" aria-label="EMS 홈">
        <span />
        EMS
      </a>
      <p className={cx('registration-platform')}>EVENT PLATFORM</p>
      <p className={cx('registration-nav-heading')}>{menu.heading}</p>
      <nav className={cx('registration-nav')} aria-label={`${role} 주 메뉴`}>
        {menu.items.map(({ id, label, href }) =>
          href === null ? (
            <span className={cx('is-disabled')} aria-disabled="true" key={id}>
              ◦　 {label}
            </span>
          ) : (
            <a
              aria-current={activePage === id ? 'page' : undefined}
              className={cx(activePage === id ? 'is-active' : '')}
              href={href}
              key={id}
            >
              ◦　 {label}
            </a>
          ),
        )}
      </nav>
    </header>
  );
}

export default function Header({ role = 'COMMON', activePage = 'events' }) {
  if (role === 'ADMIN') return <RoleHeader role="ADMIN" activePage={activePage} />;
  if (role === 'USER') return <RoleHeader role="USER" activePage={activePage} />;
  return <RoleHeader role="COMMON" activePage={activePage} />;
}
