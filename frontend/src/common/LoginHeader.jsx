import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginHeader = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  return (
    <aside className="flex flex-col justify-between bg-[#17253c] px-5 py-7 text-white lg:w-[214px] lg:shrink-0">
      <div>
        {/* EMS 로고 */}
        <div>
          <div className="flex items-center gap-3">
            <span className="h-[27px] w-[7px] rounded-[3px] bg-[#169b62]" />

            <h1 className="text-[23px] font-bold leading-none tracking-tight">EMS</h1>
          </div>

          <p className="mt-3 text-[10px] font-medium text-[#afc2d2]">EVENT PLATFORM</p>
        </div>

        {/* 워크스페이스 메뉴 */}
        <nav aria-label="워크스페이스 메뉴" className="mt-14">
          <p className="mb-5 text-[11px] font-semibold text-[#8fa2bb]">MY WORKSPACE</p>

          <ul className="space-y-2">
            <li className="flex items-center gap-4 rounded-[7px] px-2 py-3 text-[13px] font-medium text-[#b1bfd2]">
              <span
                className="h-[4px] w-[4px] shrink-0 rounded-full border border-[#b1bfd2]"
                aria-hidden="true"
              />
              <button onClick={() => navigate('/mypage')}>마이페이지</button>
            </li>
            {['행사 찾기', '신청 내역', '세미나 참여', '실시간 투표'].map((menu) => (
              <li
                key={menu}
                className="flex items-center gap-4 rounded-[7px] px-2 py-3 text-[13px] font-medium text-[#b1bfd2]"
              >
                <span
                  className="h-[4px] w-[4px] shrink-0 rounded-full border border-[#b1bfd2]"
                  aria-hidden="true"
                />
                <span>{menu}</span>
              </li>
            ))}
            <li className="flex items-center gap-4 rounded-[7px] px-2 py-3 text-[13px] font-medium text-[#b1bfd2]">
              <span
                className="h-[4px] w-[4px] shrink-0 rounded-full border border-[#b1bfd2]"
                aria-hidden="true"
              />
              <button onClick={logout}>로그아웃</button>
            </li>
          </ul>
        </nav>
      </div>

      {/* 사이드바 하단 */}
      <div className="mt-14 text-[11px] text-[#8295ae] lg:mt-0">시안 / API 연결 전</div>
    </aside>
  );
};

export default LoginHeader;
