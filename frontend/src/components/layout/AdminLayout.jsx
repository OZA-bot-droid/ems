import { Outlet, NavLink } from 'react-router-dom';
export default function AdminLayout() { return <><nav className="subnav"><NavLink to="/admin/events">행사 관리</NavLink><NavLink to="/admin/sessions">세션 관리</NavLink><NavLink to="/admin/approvals">참가 승인</NavLink><NavLink to="/admin/polls">투표 관리</NavLink></nav><Outlet /></>; }
