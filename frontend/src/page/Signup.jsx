import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getClientId } from '../util/getClientId';
import NoLoginHeaders from '../common/NoLoginHeaders';
import { useApiUtil } from '../hook/apiUtil';

function SignupForm() {
  const navigate = useNavigate();
  const clientId = getClientId();
  const apiReq = useApiUtil();
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
      window.location.href = `http://localhost:8080/api/members/google?clientId=${clientId}&role=${role}`;
    } else {
      alert('회원 유형을 선택 후 회원가입을 진행해주세요.');
    }
  };

  // naver 회원가입
  const naverSignup = () => {
    if (role !== '') {
      window.location.href = `http://localhost:8080/api/members/naver?clientId=${clientId}&role=${role}`;
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
      const res = await apiReq(`/api/members/register`, {
        method: 'POST',
        headers: {
          'Content-type': 'application/json;charset=utf-8',
        },
        data: { ...member, role: role },
      });

      if (res.status === 201) {
        alert(res.data.message);
        navigate('/login');
      } else {
        alert(res.data.message + ' 회원가입 실패');
        return;
      }
    } catch (err) {
      console.error(err);
      alert('통신 에러');
    }
  };

  return (
    <div className="signup-scroll max-h-[720px] w-[620px] overflow-y-auto">
      <div className="w-full px-8">
        <form onSubmit={handleSubmit}>
          <h2 className="text-[26px] font-bold tracking-[-0.02em] text-[#142238]">
            새로운 계정을 만들어보세요
          </h2>
          <p className="mt-2 text-[14px] leading-6 text-[#7a879a]">
            필수 정보를 입력하여 EMS에 가입하세요.
          </p>

          <div className="mt-7">
            <label htmlFor="signup-name" className="block text-[13px] font-semibold text-[#142238]">
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
              className="mt-2 h-[44px] w-full rounded-[10px] border border-[#e5e9f0] bg-white px-4 text-[13px] text-[#142238] outline-none transition placeholder:text-[#a0a9b8] focus:border-[#169b62] focus:ring-2 focus:ring-[#169b62]/15"
            />
          </div>

          <div className="mt-4">
            <label
              htmlFor="signup-email"
              className="block text-[13px] font-semibold text-[#142238]"
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
              className="mt-2 h-[44px] w-full rounded-[10px] border border-[#e5e9f0] bg-white px-4 text-[13px] text-[#142238] outline-none transition placeholder:text-[#a0a9b8] focus:border-[#169b62] focus:ring-2 focus:ring-[#169b62]/15"
            />
          </div>

          <div className="mt-4">
            <label
              htmlFor="signup-password"
              className="block text-[13px] font-semibold text-[#142238]"
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
              className="mt-2 h-[44px] w-full rounded-[10px] border border-[#e5e9f0] bg-white px-4 text-[13px] text-[#142238] outline-none transition placeholder:text-[#a0a9b8] focus:border-[#169b62] focus:ring-2 focus:ring-[#169b62]/15"
            />
          </div>

          <div className="mt-4">
            <label
              htmlFor="signup-password-confirm"
              className="block text-[13px] font-semibold text-[#142238]"
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
              className="mt-2 h-[44px] w-full rounded-[10px] border border-[#e5e9f0] bg-white px-4 text-[13px] text-[#142238] outline-none transition placeholder:text-[#a0a9b8] focus:border-[#169b62] focus:ring-2 focus:ring-[#169b62]/15"
            />
          </div>

          <div className="my-4">
            <p className="mb-2 text-center text-xs text-gray-500">회원 유형</p>

            <div className="flex items-center justify-center gap-6">
              <button
                type="button"
                onClick={() => setRole('USER')}
                className={`
                  rounded-full px-5 py-2 transition-all duration-200
                  ${
                    role === 'USER'
                      ? 'bg-[#169b62] text-white font-bold'
                      : 'bg-transparent text-[#9aa5b4] font-medium'
                  }
                `}
              >
                참여자
              </button>
              <button
                type="button"
                onClick={() => setRole('ADMIN')}
                className={`
                  rounded-full px-5 py-2 transition-all duration-200
                  ${
                    role === 'ADMIN'
                      ? 'bg-[#169b62] text-white font-bold'
                      : 'bg-transparent text-[#9aa5b4] font-medium'
                  }
                `}
              >
                주최자
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="mt-7 flex h-[44px] w-full items-center justify-center rounded-[10px] bg-[#169b62] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#128653] focus:outline-none focus:ring-2 focus:ring-[#169b62]/30"
          >
            회원가입
          </button>

          {errorMessage && (
            <p className="mt-3 text-center text-[12px] text-red-500">{errorMessage}</p>
          )}

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-4 block w-full text-center text-[13px] font-medium text-[#169b62] hover:underline"
          >
            이미 계정이 있으신가요?&nbsp;&nbsp; 로그인
          </button>
        </form>

        {/* 소셜 로그인 영역 */}
        <div className="pb-4">
          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">또는</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={googleSignup}
            className="mt-[22px] flex h-[42px] w-full items-center justify-center gap-[12px] rounded-[10px] border border-[#d9dee7] bg-white"
          >
            <span className="text-[16px] font-bold text-[#4285f4]">G</span>
            <span className="text-[13px] font-semibold text-[#142238]">Google로 회원가입</span>
          </button>

          {/* Naver */}
          <button
            type="button"
            onClick={naverSignup}
            className="mt-[10px] flex h-[42px] w-full items-center justify-center gap-[12px] rounded-[10px] bg-[#03c75a] text-white"
          >
            <span className="text-[16px] font-bold">N</span>
            <span className="text-[13px] font-semibold">Naver로 회원가입</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const Signup = () => {
  return (
    <main className="min-h-screen bg-[#f7f9fc] lg:flex lg:items-center lg:justify-center">
      <div className="min-h-screen w-full overflow-hidden bg-[#f7f9fc] lg:min-h-0 lg:h-[790px] lg:w-[1100px] lg:flex">
        <NoLoginHeaders />

        <section className="flex flex-1 items-center justify-center py-10">
          <SignupForm />
        </section>
      </div>
    </main>
  );
};

export default Signup;
