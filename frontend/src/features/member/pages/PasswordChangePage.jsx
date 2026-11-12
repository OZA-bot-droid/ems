import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { memberApi } from '../api/memberApi.js';
import PasswordInput from '../components/PasswordInput.jsx';
import Header from '../../../components/layout/LegacyHeader.jsx';

const PasswordChange = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { setAccessToken, authLoading, accessToken, role } = useAuth();
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
      // 비밀번호 재설정 요청
      await memberApi.passwordReset(currentPassword, newPassword);

      // 정상 완료되면 로그인 페이지로 이동
      navigate('/login', {
        replace: true,
        state: {
          notice: '비밀번호가 변경되었습니다. 다시 로그인해주세요.',
        },
      });
    } catch (err) {
      // 서버에서 전달한 실제 오류 메시지 표시
      if (err.code === 'INVALID_PASSWORD_RESET_TOKEN') {
        setMessage('재설정 링크가 만료되었거나 유효하지 않습니다.');
      } else {
        setMessage(err.message || '비밀번호 재설정에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f9fc]">
      <div className="min-h-screen w-full bg-[#f7f9fc] lg:flex">
        <Header role={!authLoading && accessToken ? role : 'COMMON'} />

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
