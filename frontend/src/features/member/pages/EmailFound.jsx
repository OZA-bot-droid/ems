import React, { useState } from 'react';
import NoLoginHeaders from '../components/NoLoginHeaders';
import { memberApi } from '../api/memberApi';
import { mapClassNames } from '../../../styles/classNames.js';
import module0 from '../../../styles/member.module.scss';
import { useNavigate } from 'react-router-dom';
const cx = (value) => mapClassNames(value, module0);

const EmailFound = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');

  const emailFound = async (event) => {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    try {
      // 서버가 마스킹한 이메일을 반환
      const res = await memberApi.emailFound(trimmedName);

      // 개인정보가 포함될 수 있으므로 응답 로그를 남기지 않음
      alert(`가입된 이메일: ${res.data}`);
    } catch (err) {
      // 사용자 존재 여부가 직접 드러나지 않는 안내
      alert('이메일 정보를 확인할 수 없습니다.');
    }
  };

  return (
    <main className={cx('min-h-screen bg-ems-background')}>
      <div className={cx('min-h-screen w-full bg-ems-background lg:flex')}>
        <NoLoginHeaders />

        {/* main 영역 */}
        <section className="flex flex-1 items-center justify-center px-8 py-14 sm:px-12 lg:px-[72px] lg:py-0">
          <form onSubmit={emailFound} className="w-full max-w-[510px]">
            <h2 className="text-[26px] font-bold text-ems-text">닉네임 찾기</h2>
            <p className="mt-3 text-[14px] leading-6 text-ems-muted">
              가입한 닉네임을 입력하면
              <br />
              이메일 주소의 일부를 확인할 수 있습니다.
            </p>

            <div className="mt-9">
              <label
                htmlFor="request-email"
                className="block text-[13px] font-semibold text-ems-text"
              >
                닉네임
              </label>
              <input
                id="request-email"
                type="text"
                required
                maxLength={254}
                autoComplete="email"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="닉네임을 입력해주세요."
                className="mt-2 h-[44px] w-full rounded-[10px] border border-[#e5e9f0] bg-white px-4 text-[13px] text-ems-text outline-none placeholder:text-[#9aa5b4] focus:border-[#169b62] focus:ring-2 focus:ring-[#169b62]/15"
              />
            </div>

            <button
              type="submit"
              className="mt-7 h-[44px] w-full rounded-[10px] bg-ems-primary text-[13px] font-semibold text-white transition-colors hover:bg-ems-member-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              확인
            </button>

            <button
              type="button"
              onClick={() => navigate('/login')}
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

export default EmailFound;
