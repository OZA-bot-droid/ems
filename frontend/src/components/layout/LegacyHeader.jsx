import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/member/hooks/useAuth';

import { mapClassNames } from '../../styles/classNames.js';
import module0 from './header.module.scss';

const cx = (value) => mapClassNames(value, module0);

const MENUS = {
  COMMON: {
    heading: 'EXPLORE',
    items: [
      { id: 'home', label: '메인 화면', href: '/' },
      { id: 'events', label: '행사 목록', href: '/events' },
      { id: 'login', label: '로그인', href: '/login' },
      { id: 'signup', label: '회원가입', href: '/signup' },
    ],
  },
  USER: {
    heading: 'MY WORKSPACE',
    items: [
      { id: 'mypage', label: '마이페이지', href: '/mypage' },
      { id: 'events', label: '행사 찾기', href: '/events' },
      { id: 'registrations', label: '신청 내역', href: '/registrations' },
      { id: 'seminars', label: '세미나 참여', href: '#' },
      { id: 'votes', label: '실시간 투표', href: '/polls/vote' },
    ],
  },
  ADMIN: {
    heading: 'ADMIN WORKSPACE',
    items: [
      { id: 'mypage', label: '마이페이지', href: '/mypage' },
      { id: 'event-list', label: '행사 목록', href: '/events' },
      { id: 'events', label: '행사 관리', href: '/admin/events' },
      { id: 'sessions', label: '세션 관리', href: '/admin/sessions' },
      { id: 'approvals', label: '참가 승인', href: '/admin/approvals' },
      { id: 'votes', label: '투표 관리', href: '/admin/polls' },
      // { id: 'statistics', label: '기본 통계', href: null },
    ],
  },
};

function RoleHeader({ role, activePage }) {
  const menu = MENUS[role];
  const navigate = useNavigate();
  const location = useLocation();

  const { accessToken, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // 페이지 이동이 완료되면 모바일 메뉴 자동 닫기
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logout();
    } catch (error) {
      console.error('로그아웃 요청 실패:', error);
      alert('서버 로그아웃 요청에 실패했습니다.');
    } finally {
      setLoggingOut(false);
      setMobileOpen(false);
      navigate('/login', { replace: true });
    }
  };

  return (
    <header className={cx('app-sidebar-header')} data-role={role}>
      {/* 데스크톱 브랜드 / 모바일 상단 바 */}
      <div className={cx('header-top')}>
        <div className={cx('brand-area')}>
          <Link className={cx('registration-brand')} to="/home" aria-label="EMS 홈">
            <span />
            EMS
          </Link>

          <p className={cx('registration-platform')}>EVENT PLATFORM</p>
        </div>

        {/* 모바일에서만 노출되는 메뉴 버튼 */}
        <button
          type="button"
          className={cx('mobile-menu-toggle')}
          aria-controls="ems-mobile-navigation"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? '메뉴 닫기' : '메뉴 열기'}
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          <span aria-hidden="true">{mobileOpen ? '✕' : '☰'}</span>
          <span>{mobileOpen ? '닫기' : '메뉴'}</span>
        </button>
      </div>

      {/* 데스크톱에서는 항상 표시, 모바일에서는 접기 */}
      <div
        id="ems-mobile-navigation"
        className={cx(`mobile-menu-panel ${mobileOpen ? 'is-open' : ''}`)}
      >
        <p className={cx('registration-nav-heading')}>{menu.heading}</p>

        <nav className={cx('registration-nav')} aria-label={`${role} 주 메뉴`}>
          {menu.items.map(({ id, label, href }) => {
            const isActive = activePage === id;

            // 경로가 아직 구현되지 않은 메뉴
            if (!href || href === '#') {
              return (
                <span key={id} className={cx('is-disabled')} aria-disabled="true">
                  ◦　 {label}
                </span>
              );
            }

            return (
              <Link
                key={id}
                to={href}
                aria-current={isActive ? 'page' : undefined}
                className={cx(isActive ? 'is-active' : '')}
                onClick={() => setMobileOpen(false)}
              >
                ◦　 {label}
              </Link>
            );
          })}
        </nav>

        {/* 로그인 사용자의 로그아웃 메뉴 */}
        {accessToken && (
          <div className={cx('registration-logout')}>
            <button type="button" onClick={handleLogout} disabled={loggingOut}>
              {loggingOut ? '로그아웃 중...' : '로그아웃'}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default function Header({ role = 'COMMON', activePage = 'events' }) {
  if (role === 'ADMIN') {
    return <RoleHeader role="ADMIN" activePage={activePage} />;
  }

  if (role === 'USER') {
    return <RoleHeader role="USER" activePage={activePage} />;
  }

  return <RoleHeader role="COMMON" activePage={activePage} />;
}
