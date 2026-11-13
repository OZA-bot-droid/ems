import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { memberApi } from '../api/memberApi.js';
import NoLoginHeaders from '../components/NoLoginHeaders.jsx';

const PasswordRequest = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const passwordResetRequest = async (event) => {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setMessage('');

    try {
      const res = await memberApi.passwordResetRequest(email);

      console.log(res.data);
      if (res.status < 200 || res.status >= 300) {
        throw new Error('비밀번호 재설정 요청에 실패했습니다.');
      } else {
        setMessage(
          '계정에 해당하는 이메일이 있다면 재설정 안내가 발송됩니다. 메일함을 확인해주세요.',
        );
      }
    } catch (err) {
      console.error(err);
      setMessage(
        err.response?.data?.message || '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-ems-background">
      <div className="min-h-screen w-full bg-ems-background lg:flex">
        {/* header 영역 */}
        <NoLoginHeaders password />

        {/* main 영역 */}
        <section className="flex flex-1 items-center justify-center px-8 py-14 sm:px-12 lg:px-[72px] lg:py-0">
          <form onSubmit={passwordResetRequest} className="w-full max-w-[510px]">
            <h2 className="text-[26px] font-bold text-ems-text">비밀번호 찾기</h2>
            <p className="mt-3 text-[14px] leading-6 text-ems-muted">
              가입한 이메일 주소를 입력하면
              <br />
              비밀번호 재설정 안내를 보내드립니다.
            </p>

            <div className="mt-9">
              <label
                htmlFor="request-email"
                className="block text-[13px] font-semibold text-ems-text"
              >
                이메일
              </label>
              <input
                id="request-email"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                className="mt-2 h-[44px] w-full rounded-[10px] border border-ems-member-input-border bg-white px-4 text-[13px] text-ems-text outline-none placeholder:text-ems-member-inactive focus:border-[#169b62] focus:ring-2 focus:ring-[#169b62]/15"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-7 h-[44px] w-full rounded-[10px] bg-ems-primary text-[13px] font-semibold text-white transition-colors hover:bg-ems-member-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? '요청 중...' : '재설정 이메일 보내기'}
            </button>

            {message && (
              <p role="status" className="mt-5 text-[13px] leading-6 text-[#52627a]">
                {message}
              </p>
            )}

            <button
              type="button"
              onClick={() => navigate('/login')}
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

export default PasswordRequest;
