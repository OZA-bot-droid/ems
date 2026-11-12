import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { memberApi } from '../api/memberApi.js';
import PasswordInput from '../components/PasswordInput.jsx';
import Header from '../../../components/layout/LegacyHeader.jsx';

const PasswordReset = () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const passwordResetSuccess = async (event) => {
    event.preventDefault();

    if (loading) return;

    setMessage('');
    if (!token) {
      setMessage('유효하지 않은 비밀번호 재설정 링크입니다.');
      return;
    }
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
      const res = await memberApi.passwordReset(token, newPassword);

      if (!(res.status >= 200 && res.status < 300)) {
        if (res.data?.code === 'INVALID_PASSWORD_RESET_TOKEN') {
          setMessage(res.data.message);
        } else {
          setMessage('비밀번호 변경에 실패했습니다.');
        }
        return;
      } else {
        const data = res.data;
        console.log(data);
      }

      // 현재 페이지의 방문 기록을 '/' 페이지로 교체한다.
      navigate('/login', { replace: true });
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || '비밀번호 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-ems-background">
      <div className="min-h-screen w-full bg-ems-background lg:flex">
        {/* 비로그인 사용자가 접근하는 비밀번호 재설정 화면 */}
        <Header role="COMMON" activePage="login" />

        {/* 오른쪽 비밀번호 입력 영역 */}
        <section className="flex flex-1 items-center justify-center px-8 py-14 sm:px-12 lg:px-[72px] lg:py-0">
          <form onSubmit={passwordResetSuccess} className="w-full max-w-[510px]">
            <h2 className="text-[26px] font-bold text-ems-text">비밀번호 재설정</h2>
            <p className="mt-3 text-[14px] text-ems-muted">
              계정에 사용할 새 비밀번호를 입력해주세요.
            </p>

            <div className="mt-9">
              <label
                htmlFor="new-password"
                className="block text-[13px] font-semibold text-ems-text"
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
                className="h-[44px] w-full rounded-[10px] border border-ems-member-input-border bg-white px-4 text-[13px] text-ems-text outline-none focus:border-[#169b62] focus:ring-2 focus:ring-[#169b62]/15"
              />
              <p className="mt-2 text-[12px] text-ems-muted">
                8~20자, 영문·숫자·특수문자(!@#$%^&*) 포함
              </p>
            </div>

            <div className="mt-5">
              <label
                htmlFor="confirm-password"
                className="block text-[13px] font-semibold text-ems-text"
              >
                새 비밀번호 확인
              </label>
              <PasswordInput
                id="confirm-password"
                required
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                placeholder="새 비밀번호를 확인을 입력해주세요."
                className="h-[44px] w-full rounded-[10px] border border-ems-member-input-border bg-white px-4 text-[13px] text-ems-text outline-none focus:border-[#169b62] focus:ring-2 focus:ring-[#169b62]/15"
              />
            </div>

            {message && (
              <p role="alert" className="mt-4 text-[13px] leading-6 text-red-500">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !token}
              className="mt-8 h-[44px] w-full rounded-[10px] bg-ems-primary text-[13px] font-semibold text-white transition-colors hover:bg-ems-member-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? '변경 중...' : '비밀번호 변경하기'}
            </button>

            {!token && (
              <p className="mt-4 text-[13px] text-red-500">재설정 링크가 올바르지 않습니다.</p>
            )}

            <button
              type="button"
              onClick={() => navigate('/')}
              className="mt-7 w-full text-[13px] font-semibold text-ems-primary hover:underline"
            >
              로그인으로 돌아가기
            </button>
          </form>
        </section>
      </div>
    </main>
  );
};

export default PasswordReset;
