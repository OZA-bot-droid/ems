import { mapClassNames } from '../../styles/classNames.js';
import module0 from '../../styles/scaffold.module.scss';
const cx = value => mapClassNames(value, module0);
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../features/member/hooks/useAuth';
export default function Header() {
  const { accessToken, role, logout } = useAuth();
  return <header className={cx("header")}><Link to="/events" className={cx("brand")}>SYNC5 · EMS</Link><nav><NavLink to="/events">행사</NavLink><NavLink to="/polls">투표</NavLink>{accessToken && <NavLink to="/registrations">신청 내역</NavLink>}{role === 'ADMIN' && <NavLink to="/admin/events">운영</NavLink>}{accessToken ? <button onClick={logout}>로그아웃</button> : <Link to="/login">로그인</Link>}</nav></header>;
}
