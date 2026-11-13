import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import ChatBot from './ChatBot';

const FloatingChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();

  const scrollToTop = () => {
    // 즉시 이동 : instant
    // 부드럽게 이동 : smooth
    window.scrollTo({
      top: 0,
      behavior: 'instant',
    });
  };

  return (
    <>
      {/* 기존 페이지 */}
      <Outlet />

      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3">
        {isOpen ? (
          // 중앙 챗봇 팝업
          <div className="relative w-[clac(100vw-48px(] max-w-[450px]">
            <div className="relative w-full max-w-[450px]" role="region" aria-label="EMS 안내 챗봇">
              {/* 닫기 버튼 */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-[20px] text-white hover:bg-white/25"
                aria-label="챗봇 닫기"
              >
                ×
              </button>

              {/* 기존 챗봇 */}
              <ChatBot floating />
            </div>
          </div>
        ) : (
          // 오른쪽 아래 챗봇 버튼
          <div className="flex flex-col items-center gap-3">
            {/* Home 페이지에서만 표시 */}
            {pathname === '/home' && (
              <button
                type="button"
                onClick={scrollToTop}
                className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-ems-secondary text-ems-surface shadow-lg transition hover:scale-105"
                aria-label="맨 위로 이동"
                title="맨 위로 이동"
                style={{ fontSize: '22px' }}
              >
                ^
              </button>
            )}

            {/* 챗봇 버튼 */}
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-ems-primary text-ems-surface shadow-lg transition hover:scale-105 hover:bg-ems-member-primary-hover"
              aria-label="챗봇 열기"
              style={{ fontSize: '22px' }}
            >
              {isOpen ? '✕' : '💬'}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default FloatingChatBot;
