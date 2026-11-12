import { mapClassNames } from '../../../styles/classNames.js';
import module0 from '../../../styles/member.module.scss';
const cx = (value) => mapClassNames(value, module0);
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getClientId } from '../utils/getClientId.js';
import NoLoginHeaders from '../components/NoLoginHeaders.jsx';
import { memberApi } from '../api/memberApi.js';

function SignupForm() {
  const navigate = useNavigate();
  const clientId = getClientId();
  const [sp] = useSearchParams();
  const errorMessage = sp.get('error');

  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [role, setRole] = useState('');
  const [member, setMember] = useState({
    name: '',
    email: '',
    password: '',
  });

  // google 회원가입
  const googleSignup = () => {
    if (role !== '') {
      window.location.href = `/api/members/google?clientId=${clientId}&role=${role}`;
    } else {
      alert('회원 유형을 선택 후 회원가입을 진행해주세요.');
    }
  };

  // naver 회원가입
  const naverSignup = () => {
    if (role !== '') {
      window.location.href = `/api/members/naver?clientId=${clientId}&role=${role}`;
    } else {
      alert('회원 유형을 선택 후 회원가입을 진행해주세요.');
    }
  };

  // 자체 회원가입
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (member.password !== passwordConfirm) {
      alert('비밀번호와 비밀번호 확인을 동일하게 입력해 주세요.');
      return;
    }

    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(member.email)) {
      alert('이메일 형식이 잘못되었습니다.');
      return;
    }

    // 최소 8자, 최대 20자
    // 영문 최소 1개
    // 숫자 최소 1개
    // 특수문자 최소 1개
    // 허용 특수문자: !@#$%^&*
    if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,20}$/.test(member.password)) {
      alert('비밀번호는 8~20자이며 영문, 숫자, 특수문자(!@#$%^&*)를 포함해야 합니다.');
      return;
    }

    if (role === '') {
      alert('회원 유형을 선택 후 회원가입을 진행해주세요.');
      return;
    }

    try {
      await memberApi.register({ ...member, role });
      alert('회원가입이 완료되었습니다.');
      navigate('/mypage');
    } catch (error) {
      alert(error?.message || '회원가입 요청에 실패했습니다.');
    }
  };

  return (
    <div className={cx('w-[600px] px-8')}>
      <form onSubmit={handleSubmit}>
        <h2 className={cx('text-[26px] font-bold tracking-[-0.02em] text-[#142238]')}>
          새로운 계정을 만들어보세요
        </h2>
        <p className={cx('mt-2 text-[14px] leading-6 text-[#7a879a]')}>
          필수 정보를 입력하여 EMS에 가입하세요.
        </p>

        <div className={cx('mt-7')}>
          <label
            htmlFor="signup-name"
            className={cx('block text-[13px] font-semibold text-[#142238]')}
          >
            이름
          </label>
          <input
            id="signup-name"
            type="text"
            name="name"
            onChange={(event) =>
              setMember((m) => ({ ...m, [event.target.name]: event.target.value }))
            }
            placeholder="홍길동"
            autoComplete="name"
            className={cx(
              'mt-2 h-[44px] w-full rounded-[10px] border border-[#e5e9f0] bg-white px-4 text-[13px] text-[#142238] outline-none transition placeholder:text-[#a0a9b8] focus:border-[#169b62] focus:ring-2 focus:ring-[#169b62]/15',
            )}
          />
        </div>

        <div className={cx('mt-4')}>
          <label
            htmlFor="signup-email"
            className={cx('block text-[13px] font-semibold text-[#142238]')}
          >
            이메일
          </label>
          <input
            id="signup-email"
            type="email"
            name="email"
            onChange={(event) =>
              setMember((m) => ({ ...m, [event.target.name]: event.target.value }))
            }
            placeholder="name@example.com"
            autoComplete="email"
            className={cx(
              'mt-2 h-[44px] w-full rounded-[10px] border border-[#e5e9f0] bg-white px-4 text-[13px] text-[#142238] outline-none transition placeholder:text-[#a0a9b8] focus:border-[#169b62] focus:ring-2 focus:ring-[#169b62]/15',
            )}
          />
        </div>

        <div className={cx('mt-4')}>
          <label
            htmlFor="signup-password"
            className={cx('block text-[13px] font-semibold text-[#142238]')}
          >
            비밀번호
          </label>
          <input
            id="signup-password"
            type="password"
            name="password"
            onChange={(event) =>
              setMember((m) => ({ ...m, [event.target.name]: event.target.value }))
            }
            placeholder="••••••••"
            autoComplete="new-password"
            className={cx(
              'mt-2 h-[44px] w-full rounded-[10px] border border-[#e5e9f0] bg-white px-4 text-[13px] text-[#142238] outline-none transition placeholder:text-[#a0a9b8] focus:border-[#169b62] focus:ring-2 focus:ring-[#169b62]/15',
            )}
          />
        </div>

        <div className={cx('mt-4')}>
          <label
            htmlFor="signup-password-confirm"
            className={cx('block text-[13px] font-semibold text-[#142238]')}
          >
            비밀번호 확인
          </label>
          <input
            id="signup-password-confirm"
            type="password"
            value={passwordConfirm}
            onChange={(event) => setPasswordConfirm(event.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            className={cx(
              'mt-2 h-[44px] w-full rounded-[10px] border border-[#e5e9f0] bg-white px-4 text-[13px] text-[#142238] outline-none transition placeholder:text-[#a0a9b8] focus:border-[#169b62] focus:ring-2 focus:ring-[#169b62]/15',
            )}
          />
        </div>

        <div className={cx('my-4')}>
          <p className={cx('mb-2 text-center text-xs text-gray-500')}>회원 유형</p>

          <div className={cx('flex items-center justify-center gap-6')}>
            <button
              type="button"
              onClick={() => setRole('USER')}
              className={cx(`
                  rounded-full px-5 py-2 transition-all duration-200
                  ${
                    role === 'USER'
                      ? 'bg-[#169b62] text-white font-bold'
                      : 'bg-transparent text-[#9aa5b4] font-medium'
                  }
                `)}
            >
              참여자
            </button>
            <button
              type="button"
              onClick={() => setRole('ADMIN')}
              className={cx(`
                  rounded-full px-5 py-2 transition-all duration-200
                  ${
                    role === 'ADMIN'
                      ? 'bg-[#169b62] text-white font-bold'
                      : 'bg-transparent text-[#9aa5b4] font-medium'
                  }
                `)}
            >
              주최자
            </button>
          </div>
<<<<<<< HEAD

          <button
            type="submit"
            className={cx("mt-7 flex h-[44px] w-full items-center justify-center rounded-[10px] bg-[#169b62] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#128653] focus:outline-none focus:ring-2 focus:ring-[#169b62]/30")}
          >
            회원가입
          </button>

          {errorMessage && (
            <p className={cx("mt-3 text-center text-[12px] text-red-500")}>{errorMessage}</p>
          )}

          <button
            type="button"
            onClick={() => navigate('/login')}
            className={cx("mt-4 block w-full text-center text-[13px] font-medium text-[#169b62] hover:underline")}
          >
            이미 계정이 있으신가요?&nbsp;&nbsp; 로그인
          </button>
        </form>

        {/* 소셜 로그인 영역 */}
        <div className={cx("pb-4")}>
          <div className={cx("my-4 flex items-center gap-3")}>
            <div className={cx("h-px flex-1 bg-gray-200")} />
            <span className={cx("text-xs text-gray-400")}>또는</span>
            <div className={cx("h-px flex-1 bg-gray-200")} />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={googleSignup}
            className={cx("mt-[22px] flex h-[42px] w-full items-center justify-center gap-[12px] rounded-[10px] border border-[#d9dee7] bg-white")}
          >
            <span className={cx("text-[16px] font-bold text-[#4285f4]")}>G</span>
            <span className={cx("text-[13px] font-semibold text-[#142238]")}>Google로 회원가입</span>
          </button>

          {/* Naver */}
          <button
            type="button"
            onClick={naverSignup}
            className={cx("mt-[10px] flex h-[42px] w-full items-center justify-center gap-[12px] rounded-[10px] bg-[#03c75a] text-white")}
          >
            <span className={cx("text-[16px] font-bold")}>N</span>
            <span className={cx("text-[13px] font-semibold")}>Naver로 회원가입</span>
          </button>
=======
>>>>>>> origin/feature/event_dou2
        </div>

        <button
          type="submit"
          className={cx(
            'mt-7 flex h-[44px] w-full items-center justify-center rounded-[10px] bg-[#169b62] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#128653] focus:outline-none focus:ring-2 focus:ring-[#169b62]/30',
          )}
        >
          회원가입
        </button>

        {errorMessage && (
          <p className={cx('mt-3 text-center text-[12px] text-red-500')}>{errorMessage}</p>
        )}

        <button
          type="button"
          onClick={() => navigate('/login')}
          className={cx(
            'mt-4 block w-full text-center text-[13px] font-medium text-[#169b62] hover:underline',
          )}
        >
          이미 계정이 있으신가요?&nbsp;&nbsp; 로그인
        </button>
      </form>

      {/* 소셜 로그인 영역 */}
      <div className={cx('pb-4')}>
        <div className={cx('my-4 flex items-center gap-3')}>
          <div className={cx('h-px flex-1 bg-gray-200')} />
          <span className={cx('text-xs text-gray-400')}>또는</span>
          <div className={cx('h-px flex-1 bg-gray-200')} />
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={googleSignup}
          className={cx(
            'mt-[22px] flex h-[42px] w-full items-center justify-center gap-[12px] rounded-[10px] border border-[#d9dee7] bg-white',
          )}
        >
          <span className={cx('text-[16px] font-bold text-[#4285f4]')}>G</span>
          <span className={cx('text-[13px] font-semibold text-[#142238]')}>Google로 회원가입</span>
        </button>

        {/* Naver */}
        <button
          type="button"
          onClick={naverSignup}
          className={cx(
            'mt-[10px] flex h-[42px] w-full items-center justify-center gap-[12px] rounded-[10px] bg-[#03c75a] text-white',
          )}
        >
          <span className={cx('text-[16px] font-bold')}>N</span>
          <span className={cx('text-[13px] font-semibold')}>Naver로 회원가입</span>
        </button>
      </div>
    </div>
  );
}

const Signup = () => {
  return (
    <main className={cx('min-h-screen bg-[#f7f9fc]')}>
      <div className={cx('min-h-screen w-full bg-[#f7f9fc] lg:flex')}>
        <NoLoginHeaders />

        <section
          className={cx('min-w-0 flex-1 px-6 py-10 sm:px-10 lg:px-12 lg:py-16 flex justify-center')}
        >
          <SignupForm />
        </section>
      </div>
    </main>
  );
};

export default Signup;

