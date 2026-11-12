import React from 'react';

const NoLoginHeaders = () => {
  return (
    <aside className="bg-ems-sidebar px-8 py-10 text-white sm:px-12 lg:w-[420px] lg:shrink-0 lg:px-14">
      <div className="lg:pt-[65px]">
        <div className="flex items-center gap-3">
          <span className="h-[39px] w-3 rounded-[5px] bg-ems-primary" />
          <h1 className="text-[36px] font-bold leading-none tracking-[-0.02em]">EMS</h1>
        </div>
        <p className="mt-5 text-[13px] font-semibold text-[#afc2d2]">CLOUD NATIVE EVENT PLATFORM</p>
      </div>

      <div className="mt-28 lg:mt-[132px]">
        <h2 className="text-[29px] font-bold leading-[1.03] tracking-[-0.02em]">
          함께 만드는
          <br />더 나은 행사 경험
        </h2>
        <p className="mt-12 text-[16px] leading-[1.15] text-[#bbc8d6]">
          행사 탐색부터 실시간 참여까지
          <br />
          통합 이벤트 관리 플랫폼
        </p>
      </div>
    </aside>
  );
};

export default NoLoginHeaders;
