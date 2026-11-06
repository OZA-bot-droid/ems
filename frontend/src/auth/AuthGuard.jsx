import React from 'react';
import { useAuth } from './AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

const AuthGuard = ({ loginRequired = false }) => {
  const { accessToken, authLoading } = useAuth();

  // 새로고침 후 refresh token을 확인하는 동안 대기
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc]">
        <p className="text-[14px] text-[#7a879a]">로그인 상태를 확인하고 있습니다.</p>
      </div>
    );
  }

  // 이미 로그인 했다면 My Page로 이동
  if (loginRequired && !accessToken) {
    return <Navigate to="/" replace />;
  }
  if (!loginRequired && accessToken) {
    // 수정 예정
    return <Navigate to="/mypage" replace />;
  }
  return <Outlet />;
};

export default AuthGuard;
