import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApiUtil } from '../hooks/useApiUtil.js';

const PasswordRequest = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const apiReq = useApiUtil();

  const passwordResetRequest = async (event) => {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setMessage('');

    try {
      const res = await apiReq('/api/members/password/reset-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
        },
        body: JSON.stringify({ email }),
      });

      if (!(res.status >= 200 && res.status < 300)) {
        throw new Error('비밀번호 재설정 요청에 실패했습니다.');
      } else {
        setMessage(
          '계정에 해당하는 이메일이 있다면 재설정 안내가 발송됩니다. 메일함을 확인해주세요.',
        );
        const data = res.data;
        console.log(data);
      }
    } catch {
      setMessage('요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f9fc] lg:flex lg:items-center lg:justify-center">
      <div className="border min-h-screen w-full bg-[#f7f9fc] lg:flex lg:min-h-0 lg:h-[790px] lg:w-[1100px]">
        {/* header 영역 */}
        <aside className="bg-[#17253c] px-8 py-10 text-white sm:px-12 lg:w-[420px] lg:shrink-0 lg:px-14">
          <div className="lg:pt-[65px]">
            <div className="flex items-center gap-3">
              <span className="h-[39px] w-3 rounded-[5px] bg-[#169b62]" />
              <h1 className="text-[36px] font-bold">EMS</h1>
            </div>
            <p className="mt-5 text-[13px] font-semibold text-[#afc2d2]">
              CLOUD NATIVE EVENT PLATFORM
            </p>
          </div>

          <div className="mt-20 lg:mt-[132px]">
            <h2 className="text-[29px] font-bold leading-tight">
              안전하게
              <br />
              계정을 관리하세요
            </h2>
            <p className="mt-10 text-[16px] leading-relaxed text-[#bbc8d6]">
              비밀번호를 잊으셨나요?
              <br />
              이메일로 재설정을 도와드립니다.
            </p>
          </div>
        </aside>

        {/* main 영역 */}
        <section className="flex flex-1 items-center px-8 py-14 sm:px-12 lg:px-[72px] lg:py-0">
          <form onSubmit={passwordResetRequest} className="w-full max-w-[510px]">
            <h2 className="text-[26px] font-bold text-[#142238]">비밀번호 찾기</h2>
            <p className="mt-3 text-[14px] leading-6 text-[#7a879a]">
              가입한 이메일 주소를 입력하면
              <br />
              비밀번호 재설정 안내를 보내드립니다.
            </p>

            <div className="mt-9">
              <label
                htmlFor="request-email"
                className="block text-[13px] font-semibold text-[#142238]"
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
                className="mt-2 h-[44px] w-full rounded-[10px] border border-[#e5e9f0] bg-white px-4 text-[13px] text-[#142238] outline-none placeholder:text-[#9aa5b4] focus:border-[#169b62] focus:ring-2 focus:ring-[#169b62]/15"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-7 h-[44px] w-full rounded-[10px] bg-[#169b62] text-[13px] font-semibold text-white transition-colors hover:bg-[#128653] disabled:cursor-not-allowed disabled:opacity-60"
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
              onClick={() => navigate('/')}
              className="mt-7 w-full text-[13px] font-semibold text-[#169b62] hover:underline"
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
