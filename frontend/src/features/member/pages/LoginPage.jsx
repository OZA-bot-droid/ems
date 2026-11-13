import { mapClassNames } from '../../../styles/classNames.js';
import module0 from '../../../styles/member.module.scss';
const cx = (value) => mapClassNames(value, module0);
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getClientId } from '../utils/getClientId.js';
import { useAuth } from '../hooks/useAuth.js';
import NoLoginHeaders from '../components/NoLoginHeaders.jsx';
import { getRoleFromAccessToken } from '../../../api/jwtClaims.js';
import PasswordInput from '../components/PasswordInput.jsx';

function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const [sp] = useSearchParams();
  const errorMessage = sp.get('error');
  const navigate = useNavigate();
  const clientId = getClientId();

  const googleLogin = () => {
    window.location.href = `/api/members/google?clientId=${clientId}`;
  };

  const naverLogin = () => {
    window.location.href = `/api/members/naver?clientId=${clientId}`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const token = await login({ email, password });
      // 관리자(토큰의 role = ADMIN)는 행사 관리, 그 외는 마이페이지로
      navigate(getRoleFromAccessToken(token) === 'ADMIN' ? '/admin/events' : '/mypage', { replace: true });
    } catch (err) {
      alert(err.response?.data?.message || '로그인 실패');
      console.error(err);
    }
  };

  return (
    <div className={cx('flex justify-center')}>
      {/* 로그인 폼은 최대 600px 유지, 작은 화면에서는 축소 */}
      <form onSubmit={handleSubmit} className={cx('w-full max-w-[600px]')}>
        <h2 className={cx('text-[26px] font-bold leading-normal tracking-[-0.02em] text-ems-text')}>
          다시 만나 반갑습니다
        </h2>
        <p className={cx('mt-3 text-[14px] text-ems-muted')}>계정 정보를 입력하여 로그인하세요.</p>

        <div className={cx('mt-[31px]')}>
          <label
            htmlFor="login-email"
            className={cx('block text-[13px] font-semibold text-ems-text')}
          >
            이메일
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            autoComplete="email"
            className={cx(
              'mt-[9px] h-[42px] w-full rounded-[9px] border-0 bg-white px-[17px] text-[12px] text-ems-text outline-none placeholder:text-ems-muted focus:ring-2 focus:ring-ems-primary/25',
            )}
          />
        </div>

        <div className={cx('mt-[10px]')}>
          <label
            htmlFor="login-password"
            className={cx('block text-[13px] font-semibold text-ems-text')}
          >
            비밀번호
          </label>
          <PasswordInput
            id="login-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            autoComplete
            className="h-[42px] w-full rounded-[9px] border-0 bg-white px-[17px] text-[12px] text-ems-text outline-none placeholder:text-ems-muted focus:ring-2 focus:ring-ems-primary/25"
          />
        </div>

        <button
          type="submit"
          className={cx(
            'mt-[53px] text-center h-[42px] w-full rounded-[10px] bg-ems-primary px-4 text-[13px] font-semibold text-white transition-colors hover:bg-ems-member-primary-hover focus:outline-none focus:ring-2 focus:ring-ems-primary/30',
          )}
        >
          로그인
        </button>

        {errorMessage && <p className={cx('mt-[10px]')}>{errorMessage}</p>}

        <button
          type="button"
          onClick={() => navigate('/email/found')}
          className={cx(
            'block mt-[22px] text-[14px] font-semibold text-ems-primary hover:underline',
          )}
        >
          이메일을 잊어 버리셨나요?&nbsp;&nbsp; 이메일 찾기
        </button>

        <button
          type="button"
          onClick={() => navigate('/password/request')}
          className={cx(
            'block mt-[22px] text-[14px] font-semibold text-ems-primary hover:underline',
          )}
        >
          비밀번호를 잊어 버리셨나요?&nbsp;&nbsp; 비밀번호 재발급
        </button>

        <button
          type="button"
          onClick={() => navigate('/signup')}
          className={cx(
            'block mt-[22px] text-[14px] font-semibold text-ems-primary hover:underline',
          )}
        >
          계정이 없으신가요?&nbsp;&nbsp; 회원가입
        </button>

        {/* 소셜 로그인 */}
        <div className={cx('mt-[28px] flex items-center gap-[18px]')}>
          <div className={cx('h-px flex-1 bg-ems-member-divider')} />
          <span className={cx('text-[12px] text-ems-muted')}>또는</span>
          <div className={cx('h-px flex-1 bg-ems-member-divider')} />
        </div>

        {/* Google 로그인 */}
        <button
          type="button"
          onClick={googleLogin}
          className={cx(
            'mt-[20px] flex h-[42px] w-full items-center justify-center gap-[18px] rounded-[10px] border border-ems-member-divider bg-white text-[13px] font-semibold text-ems-text',
          )}
        >
          <span className={cx('text-[16px] font-bold text-ems-google-blue')}>G</span>
          Google로 로그인
        </button>

        {/* Naver 로그인 */}
        <button
          type="button"
          onClick={naverLogin}
          className={cx(
            'mt-[10px] flex h-[42px] w-full items-center justify-center gap-[18px] rounded-[10px] bg-ems-naver-green text-[13px] font-semibold text-white',
          )}
        >
          <span className={cx('text-[16px] font-bold')}>N</span>
          Naver로 로그인
        </button>
      </form>
    </div>
  );
}

const Login = () => {
  return (
    <main className={cx('min-h-screen bg-ems-background')}>
      <div className={cx('min-h-screen w-full bg-ems-background lg:flex')}>
        <NoLoginHeaders />

        <section
          className={cx(
            'flex min-w-0 flex-1 flex-col justify-center px-6 py-10 sm:px-10 lg:px-12 lg:py-16',
          )}
        >
          <LoginForm />
        </section>
      </div>
    </main>
  );
};

export default Login;
