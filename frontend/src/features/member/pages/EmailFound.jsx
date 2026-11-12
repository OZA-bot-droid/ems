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

    try {
      const res = await memberApi.emailFound(name);

      alert('당신의 이메일은 ' + res.data + '입니다.');
      console.log(res);
    } catch (err) {
      console.error(err);
      alert('존재하지 않는 회원입니다.');
    }
  };

  return (
    <main className={cx('min-h-screen bg-[#f7f9fc]')}>
      <div className={cx('min-h-screen w-full bg-[#f7f9fc] lg:flex')}>
        <NoLoginHeaders />

        {/* main 영역 */}
        <section className="flex flex-1 items-center justify-center px-8 py-14 sm:px-12 lg:px-[72px] lg:py-0">
          <form onSubmit={emailFound} className="w-full max-w-[510px]">
            <h2 className="text-[26px] font-bold text-[#142238]">닉네임 찾기</h2>
            <p className="mt-3 text-[14px] leading-6 text-[#7a879a]">
              가입한 닉네임을 입력하면
              <br />
              가입한 이메일을 보내드립니다.
            </p>

            <div className="mt-9">
              <label
                htmlFor="request-email"
                className="block text-[13px] font-semibold text-[#142238]"
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
                className="mt-2 h-[44px] w-full rounded-[10px] border border-[#e5e9f0] bg-white px-4 text-[13px] text-[#142238] outline-none placeholder:text-[#9aa5b4] focus:border-[#169b62] focus:ring-2 focus:ring-[#169b62]/15"
              />
            </div>

            <button
              type="submit"
              className="mt-7 h-[44px] w-full rounded-[10px] bg-[#169b62] text-[13px] font-semibold text-white transition-colors hover:bg-[#128653] disabled:cursor-not-allowed disabled:opacity-60"
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
