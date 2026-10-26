import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import EventList from './Event/EventList.jsx';
import { getDevUser, setDevUser } from './api.js';

function App() {
  const [role, setRole] = useState(getDevUser().role);
  const [selectedId, setSelectedId] = useState(null);

  // 개발용: 관리자/일반 사용자를 바꿔 가며 화면 확인 (로그인 완성 후 삭제)
  const changeRole = (next) => {
    setDevUser(next);
    setRole(next);
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-amber-50 px-4 py-2 text-xs text-amber-800">
        <span className="font-semibold">개발용 사용자</span>
        {['ADMIN', 'USER'].map((r) => (
          <button
            key={r}
            onClick={() => changeRole(r)}
            className={`rounded px-2 py-1 ${role === r ? 'bg-amber-600 text-white' : 'bg-white'}`}
          >
            {r === 'ADMIN' ? '관리자' : '일반 사용자'}
          </button>
        ))}
        {selectedId && <span className="ml-auto">선택한 행사 id: {selectedId} (상세 화면은 다음 단계)</span>}
      </div>

      {/* key={role}: 사용자가 바뀌면 목록을 처음부터 다시 불러옴 */}
      <EventList key={role} onSelect={setSelectedId} />
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
