import React from 'react';
import '../style.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getClientId } from '../util/getClientId';
import { useAuth } from '../auth/AuthContext';
import NoLoginHeaders from '../common/NoLoginHeaders';
import { useApiUtil } from '../hook/apiUtil';

function LoginForm() {
  const { setAccessToken } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const apiReq = useApiUtil();

  const [sp] = useSearchParams();
  const errorMessage = sp.get('error');
  const navigate = useNavigate();
  const clientId = getClientId();

  const googleLogin = () => {
    window.location.href = `http://localhost:8080/api/members/google?clientId=${clientId}`;
  };

  const naverLogin = () => {
    window.location.href = `http://localhost:8080/api/members/naver?clientId=${clientId}`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const res = await apiReq(`/api/members/login`, {
        method: 'POST',
        withCredentials: true,
        headers: {
          'Content-type': 'application/json;charset=utf-8',
        },
        data: { email, password, clientId },
      });

      if (res.status >= 200 && res.status < 300) {
        alert('로그인 성공');
        setAccessToken(res.data.data.accessToken);
        localStorage.setItem('isLoginSession', 'true');
        navigate('/main');
      } else {
        alert('로그인 실패');
        console.log(res.data);
      }
    } catch (err) {
      alert('로그인 실패');
      console.log(err);
    }
  };

  return (
    <div className="flex justify-center">
      <form onSubmit={handleSubmit} className="w-[600px]">
        <h2 className="text-[26px] font-bold leading-normal tracking-[-0.02em] text-[#142238]">
          다시 만나 반갑습니다
        </h2>
        <p className="mt-3 text-[14px] text-[#7a879a]">계정 정보를 입력하여 로그인하세요.</p>

        <div className="mt-[31px]">
          <label htmlFor="login-email" className="block text-[13px] font-semibold text-[#142238]">
            이메일
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            autoComplete="email"
            className="mt-[9px] h-[42px] w-full rounded-[9px] border-0 bg-white px-[17px] text-[12px] text-[#142238] outline-none placeholder:text-[#7a879a] focus:ring-2 focus:ring-[#169b62]/25"
          />
        </div>

        <div className="mt-[10px]">
          <label
            htmlFor="login-password"
            className="block text-[13px] font-semibold text-[#142238]"
          >
            비밀번호
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            className="mt-[9px] h-[42px] w-full rounded-[9px] border-0 bg-white px-[17px] text-[12px] text-[#142238] outline-none placeholder:text-[#7a879a] focus:ring-2 focus:ring-[#169b62]/25"
          />
        </div>

        <button
          type="submit"
          className="mt-[53px] text-center h-[42px] w-full rounded-[10px] bg-[#169b62] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#128653] focus:outline-none focus:ring-2 focus:ring-[#169b62]/30"
        >
          로그인
        </button>

        {errorMessage && <p className="mt-[10px]">{errorMessage}</p>}

        <button
          type="button"
          onClick={() => navigate('/password/request')}
          className="block mt-[22px] text-[14px] font-semibold text-[#169b62] hover:underline"
        >
          비밀번호를 잊어 버리셨나요?&nbsp; 비밀번호 재발급
        </button>

        <button
          type="button"
          onClick={() => navigate('/signup')}
          className="block mt-[22px] text-[14px] font-semibold text-[#169b62] hover:underline"
        >
          계정이 없으신가요?&nbsp; 회원가입
        </button>

        {/* 소셜 로그인 */}
        <div className="mt-[28px] flex items-center gap-[18px]">
          <div className="h-px flex-1 bg-[#d9dee7]" />
          <span className="text-[12px] text-[#7a879a]">또는</span>
          <div className="h-px flex-1 bg-[#d9dee7]" />
        </div>

        {/* Google 로그인 */}
        <button
          type="button"
          onClick={googleLogin}
          className="mt-[20px] flex h-[42px] w-full items-center justify-center gap-[18px] rounded-[10px] border border-[#d9dee7] bg-white text-[13px] font-semibold text-[#142238]"
        >
          <span className="text-[16px] font-bold text-[#4285f4]">G</span>
          Google로 로그인
        </button>

        {/* Naver 로그인 */}
        <button
          type="button"
          onClick={naverLogin}
          className="mt-[10px] flex h-[42px] w-full items-center justify-center gap-[18px] rounded-[10px] bg-[#03c75a] text-[13px] font-semibold text-white"
        >
          <span className="text-[16px] font-bold">N</span>
          Naver로 로그인
        </button>
      </form>
    </div>
  );
}

const Login = () => {
  return (
    <main className="min-h-screen bg-[#f7f9fc]">
      <div className="min-h-screen w-full bg-[#f7f9fc] lg:flex">
        <NoLoginHeaders />

        <section className="flex min-w-0 flex-1 flex-col justify-center px-6 py-10 sm:px-10 lg:px-12 lg:py-16">
          <LoginForm />
        </section>
      </div>
    </main>
  );
};

export default Login;
