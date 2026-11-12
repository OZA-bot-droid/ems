import { Link, useNavigate } from 'react-router-dom';
import { mapClassNames } from '../../styles/classNames.js';
import styles from './header.module.scss';
import { useAuth } from '../../features/member/hooks/useAuth.js';

const cx = (value) => mapClassNames(value, styles);

const MENUS = {
  COMMON: {
    heading: 'EXPLORE',
    items: [
      { id: 'events', label: '행사 목록', href: '/events' },
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
      { id: 'mypage', label: '마이페이지', href: '/mypage' },
      { id: 'logout', label: '로그아웃', action: 'logout' },
    ],
  },
  ADMIN: {
    heading: 'ADMIN WORKSPACE',
    items: [
      { id: 'dashboard', label: '운영 대시보드', href: null },
      { id: 'event-list', label: '행사 목록', href: '/events' },
      { id: 'events', label: '행사 관리', href: '/admin/events' },
      { id: 'sessions', label: '세션 관리', href: '/admin/sessions' },
      { id: 'approvals', label: '참가 승인', href: '/admin/approvals' },
      { id: 'votes', label: '투표 관리', href: '/admin/polls' },
      { id: 'mypage', label: '마이페이지', href: '/mypage' },
      { id: 'logout', label: '로그아웃', action: 'logout' },
    ],
  },
};

export default function Header({ role: requestedRole, activePage = 'events' }) {
  const { role: authenticatedRole, logout } = useAuth();
  const role = requestedRole ?? authenticatedRole ?? 'COMMON';
  const menu = MENUS[role] ?? MENUS.COMMON;
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error(error);
    }
    navigate('/login', { replace: true });
  }

  return (
    <header className={cx('app-sidebar-header')} data-role={role}>
      <Link className={cx('registration-brand')} to="/events" aria-label="EMS 홈">
        <span />
        EMS
      </Link>
      <p className={cx('registration-platform')}>EVENT PLATFORM</p>
      <p className={cx('registration-nav-heading')}>{menu.heading}</p>
      <nav className={cx('registration-nav')} aria-label={`${role} 주 메뉴`}>
        {menu.items.map(({ id, label, href, action }) => {
          if (action === 'logout') {
            return (
              <button
                type="button"
                className={cx('nav-action')}
                onClick={handleLogout}
                key={id}
              >
                ◦　 {label}
              </button>
            );
          }

          if (href === null) {
            return (
              <span className={cx('is-disabled')} aria-disabled="true" key={id}>
                ◦　 {label}
              </span>
            );
          }

          return (
            <Link
              aria-current={activePage === id ? 'page' : undefined}
              className={cx(activePage === id ? 'is-active' : '')}
              to={href}
              key={id}
            >
              ◦　 {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
