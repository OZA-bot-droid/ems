import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/member/hooks/useAuth';

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
  ADMIN: {
    heading: 'ADMIN WORKSPACE',
    items: [
      { id: 'dashboard', label: '운영 대시보드', href: null },
      { id: 'event-list', label: '행사 목록', href: '/events' },
      { id: 'events', label: '행사 관리', href: '/admin/events' },
      { id: 'sessions', label: '세션 관리', href: '/admin/sessions' },
      { id: 'approvals', label: '참가 승인', href: '/admin/approvals' },
      { id: 'votes', label: '투표 관리', href: '/admin/polls' },
      { id: 'statistics', label: '기본 통계', href: null },
    ],
  },
};

function RoleHeader({ role, activePage }) {
  const menu = MENUS[role];
  const navigate = useNavigate();

  // 기존 AuthContext의 로그아웃 메서드를 재사용한다.
  const { accessToken, logout } = useAuth();

  // 연속 클릭에 의한 중복 로그아웃 요청 방지
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      // 서버 Refresh Token 세션 무효화 요청
      // AuthContext에서 Access Token 및 로그인 상태 정리
      await logout();
    } catch (error) {
      // 서버 요청 실패 시 AuthContext는 로컬 상태를 정리한다.
      // 단, 서버 세션 무효화까지 성공한 것은 아닐 수 있다.
      console.error('로그아웃 요청 실패:', error);
      alert('서버 로그아웃 요청에 실패했습니다.');
    } finally {
      setLoggingOut(false);

      // 뒤로 가기로 보호 화면에 복귀하지 않도록 replace 사용
      navigate('/login', { replace: true });
    }
  };

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
        {!authLoading && accessToken && (
          <a onClick={logout} className="cursor-pointer">
            ◦　 로그아웃
          </a>
        )}
      </nav>

      {/* 로그인 상태에서만 로그아웃 버튼 표시 */}
      {accessToken && (
        <div className={cx('registration-logout')}>
          <button type="button" onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? '로그아웃 중...' : '로그아웃'}
          </button>
        </div>
      )}
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
