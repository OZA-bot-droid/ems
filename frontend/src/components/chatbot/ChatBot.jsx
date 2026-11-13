import React, { useState } from 'react';
import { CHAT_OPTIONS } from './data.js';

const ChatBot = () => {
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: '안녕하세요! EMS 챗봇입니다. 궁금한 항목을 선택해주세요.',
    },
  ]);

  // 키워드 검색
  const findChatAnswer = (message) => {
    const input = message.trim().toLowerCase().replace(/\s+/g, '');

    if (!input) return '질문을 입력해주세요.';

    const matches = CHAT_OPTIONS.filter((option) =>
      option.keywords.some((keyword) => input.includes(keyword.toLowerCase().replace(/\s+/g, ''))),
    );

    if (matches.length === 0) {
      return '해당 질문에 대한 답변을 찾지 못했습니다.';
    }

    return matches.map((option) => option.answer).join('\n\n');
  };

  const handleChatSubmit = (event) => {
    event.preventDefault();

    const message = chatInput;

    const answer = findChatAnswer(message);

    setMessages((prev) => [
      ...prev,
      { type: 'user', text: message },
      { type: 'bot', text: answer },
    ]);

    setChatInput('');
  };

  // 채팅 초기화
  const resetChat = () => {
    setMessages([
      {
        type: 'bot',
        text: '안녕하세요! EMS 챗봇입니다. 궁금한 항목을 선택해주세요.',
      },
    ]);

    setChatStarted(false);
    setChatInput('');
  };

  return (
    <div className="hidden overflow-hidden rounded-[24px] border border-[#d6e3dc] bg-white shadow-[0_20px_60px_rgba(20,34,56,0.06)] lg:flex lg:flex-col">
      {/* 챗봇 헤더 */}
      <div className="flex items-center gap-3 bg-[#17253c] px-5 py-4 text-white">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#169b62] text-[20px]">
          🤖
        </div>

        <div>
          <h3 className="text-[15px] font-bold">EMS 안내 챗봇</h3>
          <p className="text-[11px] text-[#b8c8d8]">버튼을 선택해 질문할 수 있습니다.</p>
        </div>
      </div>

      {/* 채팅 메시지 */}
      <div className="flex h-[260px] flex-col gap-3 overflow-y-auto bg-[#f7f9fc] p-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] whitespace-pre-line rounded-[12px] px-4 py-3 text-[12px] leading-5 ${
                message.type === 'user'
                  ? 'bg-[#169b62] text-white'
                  : 'border border-[#e5e9f0] bg-white text-[#142238]'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-[#e5e9f0] bg-white p-4">
        <p className="mb-3 text-[12px] font-semibold text-[#52627a]">궁금한 항목을 선택해주세요.</p>

        <form onSubmit={handleChatSubmit} className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            required
            onChange={(event) => setChatInput(event.target.value)}
            placeholder="질문을 입력해주세요."
            className="min-w-0 flex-1 rounded-[9px] border border-[#d6e3dc] px-3 py-3 text-[12px] text-[#142238] outline-none focus:border-[#169b62]"
          />

          <button
            type="submit"
            disabled={!chatInput.trim()}
            className="rounded-[9px] bg-[#169b62] px-4 py-3 text-[12px] font-semibold text-white disabled:opacity-40"
          >
            전송
          </button>
        </form>

        <button
          type="button"
          onClick={resetChat}
          className="mt-3 w-full text-center text-[11px] text-[#7a879a] hover:text-[#169b62]"
        >
          대화 초기화
        </button>
      </div>
    </div>
  );
};

export default ChatBot;
