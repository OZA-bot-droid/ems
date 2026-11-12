import { createBrowserRouter, Navigate, useNavigate, useParams } from 'react-router-dom';
import { mapClassNames } from '../styles/classNames.js';
import headerStyles from '../components/layout/header.module.scss';
import Header from '../components/layout/Header.jsx';
import ProtectedRoute from '../components/guards/ProtectedRoute';
import BootstrapPage from './BootstrapPage';
import LoginPage from '../features/member/pages/LoginPage';
import SignupPage from '../features/member/pages/SignupPage';
import OAuthCallbackPage from '../features/member/pages/OAuthCallbackPage';
import PasswordRequestPage from '../features/member/pages/PasswordRequestPage';
import PasswordResetPage from '../features/member/pages/PasswordResetPage';
import MyPage from '../features/member/pages/MyPage';
import EventDiscoveryPage from '../features/event/pages/EventDiscoveryPage';
import EventDetail from '../features/event/components/EventDetail';
import RegistrationPage from '../features/event/pages/RegistrationPage';
import AdminEventPage from '../features/event/pages/AdminEventPage';
import AdminSessionPage from '../features/event/pages/AdminSessionPage';
import AdminApprovalPage from '../features/event/pages/AdminApprovalPage';
import PollManagePage from '../features/interaction/pages/PollManagePage';
import VotePage from '../features/interaction/pages/VotePage';

const cx = (value) => mapClassNames(value, headerStyles);

function EventDetailRoute() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  return (
    <div className={cx('app-shell')}>
      <Header activePage="events" />
      <main className={cx('app-main-content')}>
      <EventDetail eventId={eventId} onBack={() => navigate('/events')} />
      </main>
    </div>
  );
}

// Actual Event/Member UI is mounted without the scaffold MainLayout to avoid duplicate sidebars.
export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/events" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  { path: '/password/request', element: <PasswordRequestPage /> },
  { path: '/password/reset', element: <PasswordResetPage /> },
  { path: '/oauth-success', element: <OAuthCallbackPage /> },
  { path: '/events', element: <EventDiscoveryPage /> },
  { path: '/events/:eventId', element: <EventDetailRoute /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/registrations', element: <RegistrationPage /> },
      { path: '/login/success', element: <Navigate to="/mypage" replace /> },
      { path: '/me', element: <Navigate to="/mypage" replace /> },
      { path: '/mypage', element: <MyPage /> },
      { path: '/polls', element: <VotePage /> },
      { path: '/polls/vote', element: <VotePage /> },
    ],
  },
  {
    element: <ProtectedRoute role="ADMIN" />,
    children: [
      { path: '/admin/events', element: <AdminEventPage /> },
      { path: '/admin/sessions', element: <AdminSessionPage /> },
      { path: '/admin/approvals', element: <AdminApprovalPage /> },
      { path: '/admin/polls', element: <PollManagePage /> },
    ],
  },
  { path: '/bootstrap', element: <BootstrapPage /> },
  { path: '*', element: <p role="alert">페이지를 찾을 수 없습니다.</p> },
]);
