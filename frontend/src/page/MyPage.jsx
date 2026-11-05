import React, { useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useApiUtil } from '../util/apiUtil';
import { useNavigate } from 'react-router-dom';

const MyPage = () => {
  const { accessToken, authLoading } = useAuth();
  const apiReq = useApiUtil();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !accessToken) {
      navigate('/', { replace: true });
    } else {
      const myInfo = async () => {
        if (authLoading) {
          return;
        }

        try {
          const res = await apiReq('/members/me', {
            method: 'GET',
          });

          if (res.ok) {
            const data = await res.json();
            console.log(data);
          } else {
            console.log('에러 발생');
            console.log(res);
          }
        } catch (err) {
          console.log(err);
        }
      };
      myInfo();
    }
  }, [authLoading, accessToken, navigate]);

  if (authLoading || !accessToken) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f9fc]">
        <p className="text-sm text-[#7a879a]">로그인 상태를 확인하고 있습니다.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] lg:flex lg:items-center lg:justify-center">
      <div className="min-h-screen w-full bg-[#f7f9fc] lg:flex lg:min-h-0 lg:h-[790px] lg:w-[1100px]">
        {/* 왼쪽 EMS 브랜드 영역 */}
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
                {['내 대시보드', '행사 찾기', '신청 내역', '세미나 참여', '실시간 투표'].map(
                  (menu) => (
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
                  ),
                )}
              </ul>
            </nav>
          </div>

          {/* 사이드바 하단 */}
          <div className="mt-14 text-[11px] text-[#8295ae] lg:mt-0">시안 / API 연결 전</div>
        </aside>

        {/* 오른쪽 My Page 영역 */}
        <section className="min-w-0 flex-1 px-6 py-10 sm:px-10 lg:overflow-y-auto lg:px-12 lg:py-[65px]">
          <div className="mb-8">
            <h2 className="text-[28px] font-bold text-[#142238]">마이페이지</h2>
            <p className="mt-3 text-[13px] text-[#7a879a]">내 정보와 활동 내역을 확인하세요.</p>
          </div>

          {/* Member Service */}
          <section className="rounded-[14px] border border-[#e5e9f0] bg-white p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[17px] font-bold text-[#142238]">내 프로필</h3>
              <span className="rounded-full bg-[#e6f5ee] px-3 py-1 text-[11px] font-semibold text-[#169b62]">
                MEMBER
              </span>
            </div>

            <p className="mt-2 text-[12px] text-[#7a879a]">기본 회원 정보</p>

            <div className="mt-5 space-y-4 border-t border-[#e5e9f0] pt-5">
              <div>
                <p className="text-[12px] text-[#7a879a]">이름</p>
                <p className="mt-1 text-[14px] font-medium text-[#142238]">정보 연동 예정</p>
              </div>

              <div>
                <p className="text-[12px] text-[#7a879a]">이메일</p>
                <p className="mt-1 text-[14px] font-medium text-[#142238]">정보 연동 예정</p>
              </div>
            </div>
          </section>

          {/* 다른 서비스가 사용할 공간 */}
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {/* Event Service */}
            <section className="rounded-[14px] border border-[#e5e9f0] bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#e6f5ee]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-[#169b62]"
                    aria-hidden="true"
                  >
                    <rect x="3" y="5" width="18" height="16" rx="2" />
                    <path d="M7 3v4M17 3v4M3 10h18" />
                  </svg>
                </div>

                <div>
                  <h3 className="text-[15px] font-bold text-[#142238]">나의 행사</h3>
                  <p className="mt-1 text-[11px] text-[#7a879a]">Event Service</p>
                </div>
              </div>

              <div className="mt-5 flex min-h-[120px] items-center justify-center rounded-[10px] border border-dashed border-[#d9dee7] bg-[#f7f9fc] p-4">
                <p className="text-center text-[12px] leading-6 text-[#7a879a]">
                  행사 신청 및 주최 행사
                  <br />
                  연동 예정
                </p>
              </div>
            </section>

            {/* Interaction Service */}
            <section className="rounded-[14px] border border-[#e5e9f0] bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#e6f5ee]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-[#169b62]"
                    aria-hidden="true"
                  >
                    <path d="M5 20V11M10 20V5M15 20v-8M20 20V8" />
                  </svg>
                </div>

                <div>
                  <h3 className="text-[15px] font-bold text-[#142238]">나의 참여 활동</h3>
                  <p className="mt-1 text-[11px] text-[#7a879a]">Interaction Service</p>
                </div>
              </div>

              <div className="mt-5 flex min-h-[120px] items-center justify-center rounded-[10px] border border-dashed border-[#d9dee7] bg-[#f7f9fc] p-4">
                <p className="text-center text-[12px] leading-6 text-[#7a879a]">
                  투표 및 참여 내역
                  <br />
                  연동 예정
                </p>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
};

export default MyPage;
