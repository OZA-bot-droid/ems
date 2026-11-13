import {
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';

import { useAuth } from '../../features/member/hooks/useAuth';

export default function ProtectedRoute({ role }) {
  const {
    accessToken,
    authLoading,
    role: userRole,
  } = useAuth();

  const location = useLocation();

  // 최초 인증 복원 중:
  // 인증 여부가 결정되기 전에는 리다이렉트하지 않는다.
  if (authLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-ems-background"
        role="status"
        aria-live="polite"
      >
        <span className="text-sm text-ems-muted">
          인증 상태 확인 중...
        </span>
      </div>
    );
  }

  // 미로그인 사용자
  if (!accessToken) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // 관리자 전용 접근 제한
  if (role && userRole !== role) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        role="alert"
      >
        이 화면에 접근할 권한이 없습니다.
      </div>
    );
  }

  return <Outlet />;
}