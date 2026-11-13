import { Outlet, NavLink } from 'react-router-dom';
import styles from '../../styles/scaffold.module.scss';

/**
 * EMS 관리자 하위 내비게이션
 *
 * P0 수정 내용
 * - subnav 클래스를 CSS Modules에 연결
 * - 기존 라우팅 경로 및 메뉴 순서 유지
 * - Outlet 구조 유지
 *
 * 현재 라우터에서 실제 사용 여부와 관계없이
 * 공통 레이아웃의 스타일 연결을 정상화한다.
 */
export default function AdminLayout() {
  return (
    <>
      <nav className={styles.subnav}>
        <NavLink to="/admin/events">행사 관리</NavLink>

        <NavLink to="/admin/sessions">세션 관리</NavLink>

        <NavLink to="/admin/approvals">참가 승인</NavLink>

        <NavLink to="/admin/polls">투표 관리</NavLink>
      </nav>

      <Outlet />
    </>
  );
}
