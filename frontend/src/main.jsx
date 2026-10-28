import React from 'react';
import { createRoot } from 'react-dom/client';
import RegistrationPage from './pages/user/RegistrationPage.jsx';
import './style.css';
import EventPage from './Event/EventPage.jsx'; // 행사 화면 (이도관)

function BootstrapPage() {
  const [data, setData] = React.useState({});
  React.useEffect(() => {
    Promise.all(
      ['members', 'events', 'interactions'].map(async (service) => {
        try {
          const response = await fetch('/api/' + service + '/ping');
          if (!response.ok) throw new Error('HTTP ' + response.status);
          return [service, await response.json()];
        } catch (error) {
          return [service, { status: 'ERROR', error: error.message }];
        }
      }),
    ).then((result) => setData(Object.fromEntries(result)));
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm font-semibold text-emerald-700">EMS · Bootstrap</p>
      <h1 className="mt-3 text-4xl font-bold">통합 이벤트 관리 플랫폼</h1>
      <p className="mt-3 text-slate-600">
        React + Vite + Tailwind CSS / Cloud Native MSA 초기 연결 확인
      </p>
      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {['members', 'events', 'interactions'].map((name) => (
          <article key={name} className="rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold">{name}</h2>
            <p className="mt-2 text-sm text-slate-500">{data[name]?.status || 'Checking...'}</p>
          </article>
        ))}
      </section>
      <a
        className="mt-8 inline-block rounded-lg bg-slate-900 px-4 py-2 text-white"
        href="/registrations"
      >
        나의 참가 신청 보기
      </a>
      <p className="mt-8 text-sm text-slate-500">
        현재 회원 인증과 행사 CRUD는 후속 구현이 필요합니다.
      </p>
    </main>
  );
}

// 임시 주소 나누기 (팀 라우터가 정해지면 교체)
// /registrations → 참가 신청(이도형), /bootstrap → 서버 연결 확인, 나머지 → 행사 화면(이도관)
function App() {
  const path = window.location.pathname;
  if (path === '/registrations') return <RegistrationPage />;
  if (path === '/bootstrap') return <BootstrapPage />;
  return <EventPage />;
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
