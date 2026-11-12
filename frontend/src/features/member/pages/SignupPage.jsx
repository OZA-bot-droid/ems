import { mapClassNames } from '../../../styles/classNames.js';
import module0 from '../../../styles/member.module.scss';
const cx = (value) => mapClassNames(value, module0);
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getClientId } from '../utils/getClientId.js';
import NoLoginHeaders from '../components/NoLoginHeaders.jsx';
import { memberApi } from '../api/memberApi.js';
import PasswordInput from '../components/PasswordInput.jsx';
import { signupInput, primaryButton, outlineButton } from '../styles/memberFormStyles.js';

function SignupForm() {
  const navigate = useNavigate();
  const clientId = getClientId();
  const [sp] = useSearchParams();
  const errorMessage = sp.get('error');

  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [nameDuplicate, setNameDuplicate] = useState(true);

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

    if (nameDuplicate) {
      alert('닉네임 중복 확인을 완료해주세요.');
      return;
    }

    if (!verifiedEmail || verifiedEmail !== member.email.trim().toLowerCase()) {
      alert('이메일 인증을 완료해주세요.');
      return;
    }
    if (sending || verifying) return;
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
      const res = await memberApi.register({ ...member, role });
      alert(res.message);
      navigate('/login');
    } catch (error) {
      alert(error.response?.data?.message || '회원가입 요청에 실패했습니다.');
      console.log(error);
    }
  };

  // 인증 확인 함수
  const verifyEmailCode = async () => {
    const email = member.email.trim().toLowerCase();

    if (!codeSent || verifiedEmail || verifying || sending) return;

    if (!/^\d{6}$/.test(verificationCode)) {
      alert('인증번호 6자리를 입력해주세요.');
      return;
    }

    setVerifying(true);

    try {
      const res = await memberApi.emailVerify(email, verificationCode);

      setVerifiedEmail(email);
      alert(res.message);
      console.log(res);
    } catch (err) {
      console.error(err);
      alert('서버 연결 중 오류가 발생했습니다.');
    } finally {
      setVerifying(false);
    }
  };

  // 이메일 인증 요청 함수
  const sendVerificationCode = async () => {
    const email = member.email.trim().toLowerCase();

    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
      alert('올바른 이메일을 입력해주세요.');
      return;
    }

    if (sending || verifying) return;

    setSending(true);

    try {
      const res = await memberApi.emailSend(email);

      setCodeSent(true);
      setVerifiedEmail('');
      setVerificationCode('');
      alert(res.message);
      console.log(res);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || '요청을 처리하지 못했습니다.');
    } finally {
      setSending(false);
    }
  };

  // 닉네임 중복 확인

  const nameDuplicateCheck = async () => {
    const name = member.name.trim();

    // 빈 닉네임 확인 방지
    if (!name) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    try {
      const res = await memberApi.nameDuplicateCheck(name);

      // 현재 API 응답 data:
      // true  = 중복
      // false = 사용 가능
      if (res.data === false) {
        setNameDuplicate(false);
        alert('사용 가능한 닉네임입니다.');
      } else {
        setNameDuplicate(true);
        alert('이미 사용 중인 닉네임입니다.');
      }
    } catch (err) {
      setNameDuplicate(true);
      alert(err.message || '중복 확인에 실패했습니다.');
    }
  };

  return (
    <div className={cx('w-[600px] px-8')}>
      <form onSubmit={handleSubmit}>
        <h2 className={cx('text-[26px] font-bold tracking-[-0.02em] text-ems-text')}>
          새로운 계정을 만들어보세요
        </h2>
        <p className={cx('mt-2 text-[14px] leading-6 text-ems-muted')}>
          필수 정보를 입력하여 EMS에 가입하세요.
        </p>

        <div className={cx('mt-7')}>
          <label
            htmlFor="signup-name"
            className={cx('block text-[13px] font-semibold text-ems-text')}
          >
            닉네임
          </label>
          <div className={cx('mt-2 flex gap-2')}>
            <input
              id="signup-name"
              type="text"
              name="name"
              onChange={(event) => {
                setMember((m) => ({
                  ...m,
                  name: event.target.value,
                }));

                // 닉네임을 변경하면 이전 확인 결과 무효화
                setNameDuplicate(true);
              }}
              placeholder="홍길동"
              autoComplete="name"
              className={cx(`${signupInput} min-w-0 flex-1`)}
            />
            <button
              type="button"
              onClick={nameDuplicateCheck}
              disabled={!nameDuplicate}
              className={cx(`${primaryButton} h-[44px] shrink-0 text-[12px]`)}
            >
              {nameDuplicate ? '중복 확인' : '확인 완료'}
            </button>
          </div>
        </div>

        <div className={cx('mt-4')}>
          <label
            htmlFor="signup-email"
            className={cx('block text-[13px] font-semibold text-ems-text')}
          >
            이메일
          </label>
          <div className={cx('mt-2 flex gap-2')}>
            <input
              id="signup-email"
              type="email"
              name="email"
              value={member.email}
              onChange={(event) => {
                setMember((m) => ({
                  ...m,
                  email: event.target.value,
                }));
                setCodeSent(false);
                setVerifiedEmail('');
                setVerificationCode('');
              }}
              disabled={sending || verifying}
              placeholder="name@example.com"
              autoComplete="email"
              className={cx(`${signupInput} min-w-0 flex-1`)}
            />

            <button
              type="button"
              onClick={sendVerificationCode}
              disabled={sending || verifying || Boolean(verifiedEmail)}
              className={cx(`${primaryButton} h-[44px] shrink-0 text-[12px]`)}
            >
              {sending ? '발송 중...' : codeSent ? '재발송' : '인증번호 발송'}
            </button>
          </div>
        </div>

        <div className={cx('mt-3')}>
          {codeSent && !verifiedEmail && (
            <div className={cx('mt-3')}>
              <label
                htmlFor="signup-verification-code"
                className={cx('block text-[13px] font-semibold text-ems-text')}
              >
                이메일 인증번호
              </label>

              <div className={cx('mt-2 flex gap-2')}>
                <input
                  id="signup-verification-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="6자리 인증번호"
                  className={cx(
                    // 기존 44px 높이, flex 너비, focus 동작 유지
                    'h-[44px] min-w-0 flex-1 rounded-[10px] ' +
                      'border border-ems-member-input-border ' +
                      'bg-white px-4 text-[13px] outline-none ' +
                      // P2: 하드코딩된 초록색만 토큰으로 교체
                      'focus:border-ems-primary',
                  )}
                />

                <button
                  type="button"
                  onClick={verifyEmailCode}
                  disabled={verifying || sending || verificationCode.length !== 6}
                  className={cx(`${outlineButton} `)}
                >
                  {verifying ? '확인 중...' : '인증 확인'}
                </button>
              </div>

              <p className={cx('mt-2 text-[12px] text-ems-muted')}>
                이메일로 발송된 6자리 인증번호를 입력해주세요.
              </p>
            </div>
          )}

          {verifiedEmail && (
            <p className={cx('mt-3 text-[12px] font-semibold text-ems-primary')}>
              ✓ 이메일 인증이 완료되었습니다.
            </p>
          )}
        </div>

        <div className={cx('mt-4')}>
          <label
            htmlFor="signup-password"
            className={cx('block text-[13px] font-semibold text-ems-text')}
          >
            비밀번호
          </label>
          <PasswordInput
            id="signup-password"
            name="password"
            value={member.password}
            required
            onChange={(event) =>
              setMember((m) => ({ ...m, [event.target.name]: event.target.value }))
            }
            placeholder="••••••••"
            autoComplete="new-password"
            className={cx(`${signupInput} w-full`)}
          />
        </div>

        <div className={cx('mt-4')}>
          <label
            htmlFor="signup-password-confirm"
            className={cx('block text-[13px] font-semibold text-ems-text')}
          >
            비밀번호 확인
          </label>
          <PasswordInput
            id="signup-password-confirm"
            value={passwordConfirm}
            required
            onChange={(event) => setPasswordConfirm(event.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            className={cx(`${signupInput} w-full`)}
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
                      ? 'bg-ems-primary text-white font-bold'
                      : 'bg-transparent text-ems-member-inactive font-medium'
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
                      ? 'bg-ems-primary text-white font-bold'
                      : 'bg-transparent text-ems-member-inactive font-medium'
                  }
                `)}
            >
              주최자
            </button>
          </div>
        </div>

        <button
          type="submit"
          className={cx(
            `${primaryButton} mt-7 flex h-[44px] w-full items-center justify-center focus:outline-none focus:ring-2 focus:ring-ems-primary/30`,
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
            'mt-4 block w-full text-center text-[13px] font-medium text-ems-primary hover:underline',
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
            'mt-[22px] flex h-[42px] w-full items-center justify-center gap-[12px] rounded-[10px] border border-ems-member-divider bg-white',
          )}
        >
          <span className={cx('text-[16px] font-bold text-ems-google-blue')}>G</span>
          <span className={cx('text-[13px] font-semibold text-ems-text')}>Google로 회원가입</span>
        </button>

        {/* Naver */}
        <button
          type="button"
          onClick={naverSignup}
          className={cx(
            'mt-[10px] flex h-[42px] w-full items-center justify-center gap-[12px] rounded-[10px] bg-ems-naver-green text-white',
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
    <main className={cx('min-h-screen bg-ems-background')}>
      <div className={cx('min-h-screen w-full bg-ems-background lg:flex')}>
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
