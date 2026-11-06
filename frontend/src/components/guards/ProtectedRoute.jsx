import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/member/hooks/useAuth';
export default function ProtectedRoute({ role }) {
  const { accessToken, authLoading, role: userRole } = useAuth();
  const location = useLocation();
  if (authLoading) return <p>인증 상태 확인 중...</p>;
  if (!accessToken) return <Navigate to="/login" replace state={{ from: location }} />;
  if (role && userRole !== role) return <p role="alert">이 화면에 접근할 권한이 없습니다.</p>;
  return <Outlet />;
}
