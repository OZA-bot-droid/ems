import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import styles from './Layouts.module.scss';
const common=[['/events','행사 목록']];
const user=[['/user','내 대시보드'],['/user/registrations','신청 내역'],['/user/seminars','세미나 참여'],['/user/voting','실시간 투표']];
const admin=[['/admin','운영 대시보드'],['/admin/events','행사 관리'],['/admin/sessions','세션 관리'],['/admin/approvals','참가 승인'],['/admin/polls','투표 관리'],['/admin/stats','기본 통계']];
export function RequireAuth({role}){const {session}=useAuth();const location=useLocation();if(!session)return <Navigate to="/login" state={{from:location}} replace/>;if(role&&session.role!==role)return <Navigate to={session.role==='ADMIN'?'/admin':'/user'} replace/>;return <Outlet/>;}
export function Layout(){const {session,logout}=useAuth();const nav=session?.role==='ADMIN'?admin:session?user:common;
 return <div className={styles.shell}><aside className={styles.sidebar}><Link className={styles.brand} to="/events"><span className={styles.brandMark}/> EMS</Link><p className={styles.subBrand}>EVENT MANAGEMENT</p><nav aria-label="주 메뉴">{[...common,...nav.filter(([path])=>path!=='/events')].map(([to,label])=><NavLink key={to} to={to} end={to==='/user'||to==='/admin'} className={({isActive})=>isActive?styles.active:styles.navLink}>{label}</NavLink>)}</nav><div className={styles.identity}>{session?<><p>{session.user?.name||'회원'} · {session.role}</p><button type="button" onClick={logout}>로그아웃</button></>:<><Link to="/login">로그인</Link><Link to="/register">회원가입</Link></>}</div></aside><div className={styles.content}><header className={styles.topbar}><Link to="/events">EMS / 이벤트 플랫폼</Link><span>{session?.mock?'MOCK · ':''}{session?.role||'GUEST'}</span></header><main className={styles.main}><Outlet/></main></div></div>;
}
export function PageTitle({title,description,children}){return <div className={styles.heading}><div><h1>{title}</h1><p>{description}</p></div>{children}</div>;}
export function Panel({title,children}){return <section className={styles.panel}>{title&&<h2>{title}</h2>}{children}</section>;}
export function Message({error,success}){return error?<p role="alert" className={styles.error}>{error}</p>:success?<p role="status" className={styles.success}>{success}</p>:null;}
