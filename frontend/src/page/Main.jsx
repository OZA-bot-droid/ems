import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { Link } from 'react-router-dom';

const Main = () => {
  const { accessToken, authLoading, logout } = useAuth();

  return (
    <>
      <header className="w-full bg-[#111827] text-white">
        <div className="mx-auto flex h-[88px] max-w-[1200px] items-center justify-between px-6">
          {/* 로고 */}
          <Link to="/">
            <img
              src="../image/sync5-logo.png"
              alt="SYNC5"
              className="h-[64px] w-auto object-contain"
            />
          </Link>

          {/* 메뉴 */}
          <nav className="flex items-center gap-10">
            <Link to="/" className="hover:text-[#22c55e]">
              홈
            </Link>

            <Link to="/events/create" className="hover:text-[#22c55e]">
              개최 Event
            </Link>

            <Link to="/events/search" className="hover:text-[#22c55e]">
              검색
            </Link>
          </nav>

          {/* 인증 메뉴 */}
          <div className="flex items-center gap-5">
            {!authLoading &&
              (accessToken ? (
                <>
                  <Link to="/mypage" className="hover:text-[#22c55e]">
                    마이페이지
                  </Link>

                  <button type="button" onClick={logout} className="hover:text-[#22c55e]">
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="hover:text-[#22c55e]">
                    로그인
                  </Link>

                  <Link to="/signup" className="hover:text-[#22c55e]">
                    회원가입
                  </Link>
                </>
              ))}
          </div>
        </div>
      </header>
      <main></main>
    </>
  );
};

export default Main;
