import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { memberApi } from '../api/memberApi.js';
import PasswordInput from '../components/PasswordInput.jsx';

const PasswordChange = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { setAccessToken, logout } = useAuth();
  const navigate = useNavigate();

  const passwordChangeSuccess = async (event) => {
    event.preventDefault();

    if (loading) return;

    setMessage('');
    if (newPassword !== passwordConfirm) {
      setMessage('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,20}$/;
    if (!passwordRegex.test(newPassword)) {
      setMessage('비밀번호는 8~20자이며 영문, 숫자, 특수문자(!@#$%^&*)를 포함해야 합니다.');
      return;
    }

    setLoading(true);
    try {
      const res = await memberApi.passwordChange(currentPassword, newPassword);

      console.log(res);
      setMessage(res.message);
      if (res.status < 200 || res.status >= 300) {
        return;
      } else {
        setAccessToken(null);
        localStorage.removeItem('isLoginSession');

        // 현재 페이지의 방문 기록을 '/login' 페이지로 교체한다.
        navigate('/login', { replace: true });
      }
    } catch (err) {
      console.error(err);
      setMessage('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f9fc]">
      <div className="min-h-screen w-full bg-[#f7f9fc] lg:flex">
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

        {/* 비밀번호 입력 영역 */}
        <section className="flex flex-1 items-center justify-center px-8 py-14 sm:px-12 lg:px-[72px] lg:py-0">
          <form onSubmit={passwordChangeSuccess} className="w-full max-w-[510px]">
            <h2 className="text-[26px] font-bold text-[#142238]">비밀번호 재설정</h2>
            <p className="mt-3 text-[14px] text-[#7a879a]">
              계정에 사용할 새 비밀번호를 입력해주세요.
            </p>

            <div className="mt-9">
              <label
                htmlFor="current-password"
                className="block text-[13px] font-semibold text-[#142238]"
              >
                현재 비밀번호
              </label>
              <PasswordInput
                id="current-password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="현재 비밀번호를 입력해주세요."
                className="h-[44px] w-full rounded-[10px] border border-[#e5e9f0] bg-white px-4 text-[13px] text-[#142238] outline-none focus:border-[#169b62] focus:ring-2 focus:ring-[#169b62]/15"
              />
            </div>

            <div className="mt-5">
              <label
                htmlFor="new-password"
                className="block text-[13px] font-semibold text-[#142238]"
              >
                새 비밀번호
              </label>
              <PasswordInput
                id="new-password"
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="새 비밀번호를 입력해주세요."
                className="h-[44px] w-full rounded-[10px] border border-[#e5e9f0] bg-white px-4 text-[13px] text-[#142238] outline-none focus:border-[#169b62] focus:ring-2 focus:ring-[#169b62]/15"
              />
              <p className="mt-2 text-[12px] text-[#7a879a]">
                8~20자, 영문·숫자·특수문자(!@#$%^&*) 포함
              </p>
            </div>

            <div className="mt-5">
              <label
                htmlFor="confirm-password"
                className="block text-[13px] font-semibold text-[#142238]"
              >
                새 비밀번호 확인
              </label>
              <PasswordInput
                id="confirm-password"
                required
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                placeholder="새 비밀번호를 다시 입력해주세요."
                className="h-[44px] w-full rounded-[10px] border border-[#e5e9f0] bg-white px-4 text-[13px] text-[#142238] outline-none focus:border-[#169b62] focus:ring-2 focus:ring-[#169b62]/15"
              />
            </div>

            {message && (
              <p role="alert" className="mt-4 text-[13px] leading-6 text-red-500">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-8 h-[44px] w-full rounded-[10px] bg-[#169b62] text-[13px] font-semibold text-white transition-colors hover:bg-[#128653] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? '변경 중...' : '비밀번호 변경하기'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/mypage')}
              className="mt-7 w-full text-[13px] font-semibold text-[#169b62] hover:underline"
            >
              마이페이지로 돌아가기
            </button>
          </form>
        </section>
      </div>
    </main>
  );
};

export default PasswordChange;
