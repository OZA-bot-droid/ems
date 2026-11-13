import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import ChatBot from './ChatBot';

const FloatingChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();
  const [position, setPosition] = useState(null);
  const dragRef = useRef(null);
  const movedRef = useRef(false);

  useEffect(() => {
    const handleResize = () => {
      // 드래그 위치 초기화
      setPosition(null);
      dragRef.current = null;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handlePointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const rect = e.currentTarget.closest('[data-chat-widget]').getBoundingClientRect();

    dragRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    movedRef.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current) return;

    const widget = e.currentTarget.closest('[data-chat-widget]');
    const rect = widget.getBoundingClientRect();

    const x = e.clientX - dragRef.current.x;
    const y = e.clientY - dragRef.current.y;

    if (Math.abs(e.movementX) > 0 || Math.abs(e.movementY) > 0) {
      movedRef.current = true;
    }

    if (!movedRef.current) return;

    // 화면 밖으로 나가지 못하도록 제한
    const maxX = Math.max(0, window.innerWidth - rect.width);
    const maxY = Math.max(0, window.innerHeight - rect.height);

    setPosition({
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY)),
    });
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const toggleChat = () => {
    if (movedRef.current) {
      movedRef.current = false;
      return;
    }

    setPosition(null);
    setIsOpen((prev) => !prev);
  };

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

      <div
        data-chat-widget
        className={`fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3 ${
          isOpen ? 'w-[min(450px,calc(100vw-48px))]' : 'w-[60px]'
        }`}
        style={
          position
            ? {
                left: position.x,
                top: position.y,
                right: 'auto',
                bottom: 'auto',
              }
            : undefined
        }
      >
        {isOpen ? (
          /* 채팅창 */
          <div
            className="relative w-full max-h-[calc(100dvh-48px)] overflow-y-auto rounded-[24px]"
            role="region"
            aria-label="EMS 안내 챗봇"
          >
            {/* 헤더 드래그 영역 */}
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="absolute left-0 right-12 top-0 z-10 h-[72px] cursor-grab touch-none active:cursor-grabbing"
              aria-label="챗봇 이동"
            />

            {/* 닫기 버튼 */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setPosition(null);
              }}
              className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-[20px] text-white hover:bg-white/25"
              aria-label="챗봇 닫기"
            >
              ×
            </button>

            <ChatBot floating />
          </div>
        ) : (
          /* 버튼 영역 */
          <div className="flex flex-col items-center gap-3">
            {pathname === '/home' && (
              <button
                type="button"
                onClick={scrollToTop}
                className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-ems-secondary text-ems-surface shadow-lg transition hover:scale-105"
                aria-label="맨 위로 이동"
                title="맨 위로 이동"
                style={{ fontSize: '22px' }}
              >
                ↑
              </button>
            )}

            <button
              type="button"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onClick={toggleChat}
              className="flex h-[60px] w-[60px] touch-none cursor-grab items-center justify-center rounded-full bg-ems-primary text-ems-surface shadow-lg active:cursor-grabbing"
              aria-label="챗봇 열기"
              style={{ fontSize: '22px' }}
            >
              💬
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default FloatingChatBot;
