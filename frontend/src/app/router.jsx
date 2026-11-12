import { createBrowserRouter, Navigate, useNavigate, useParams } from 'react-router-dom';
import ProtectedRoute from '../components/guards/ProtectedRoute';
import BootstrapPage from './BootstrapPage';
import LoginPage from '../features/member/pages/LoginPage';
import SignupPage from '../features/member/pages/SignupPage';
import OAuthCallbackPage from '../features/member/pages/OAuthCallbackPage';
import PasswordRequestPage from '../features/member/pages/PasswordRequestPage';
import PasswordResetPage from '../features/member/pages/PasswordResetPage';
import PasswordChangePage from '../features/member/pages/PasswordChangePage';
import MyPage from '../features/member/pages/MyPage';
import EventDiscoveryPage from '../features/event/pages/EventDiscoveryPage';
import EventDetail from '../features/event/components/EventDetail';
import RegistrationPage from '../features/event/pages/RegistrationPage';
import AdminEventPage from '../features/event/pages/AdminEventPage';
import AdminSessionPage from '../features/event/pages/AdminSessionPage';
import AdminApprovalPage from '../features/event/pages/AdminApprovalPage';
import PollManagePage from '../features/interaction/pages/PollManagePage';
import VotePage from '../features/interaction/pages/VotePage';

// 11/11 - 박천보 추가
// 유저의 투표 전체 목록
import PollListPage from '../features/interaction/pages/PollListPage';

// 투표 결과
import PollResultPage from '../features/interaction/pages/PollResultPage';
import EmailFound from '../features/member/pages/EmailFound';

function EventDetailRoute() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  return (
    <main className="mx-auto max-w-5xl p-6">
      <EventDetail eventId={eventId} onBack={() => navigate('/events')} />
    </main>
  );
}

// Actual Event/Member UI is mounted without the scaffold MainLayout to avoid duplicate sidebars.
export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/events" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  { path: '/password/request', element: <PasswordRequestPage /> },
  { path: '/password/reset', element: <PasswordResetPage /> },
  { path: '/password/change', element: <PasswordChangePage /> },
  { path: '/oauth-success', element: <OAuthCallbackPage /> },
  { path: '/events', element: <EventDiscoveryPage /> },
  { path: '/events/:eventId', element: <EventDetailRoute /> },
  { path: '/email/found', element: <EmailFound /> },
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
