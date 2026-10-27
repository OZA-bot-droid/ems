import React from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import EventPage from './Event/EventPage.jsx'; // 행사 화면 (이도관)
function App() {
  const [data, setData] = React.useState({});
  React.useEffect(() => {
    Promise.all(
      ['members', 'events', 'interactions'].map(async (service) => {
        try {
          const r = await fetch('/api/' + service + '/ping');
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return [service, await r.json()];
        } catch (e) {
          return [service, { status: 'ERROR', error: e.message }];
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
        {['members', 'events', 'interactions'].map((n) => (
          <article key={n} className="rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold">{n}</h2>
            <p className="mt-2 text-sm text-slate-500">{data[n]?.status || 'Checking...'}</p>
          </article>
        ))}
      </section>
      <p className="mt-8 text-sm text-slate-500">
        현재는 헬스체크 데모입니다. 로그인·행사 CRUD·WebSocket 등은 후속 PR에서 구현합니다.
      </p>
    </main>
  );
}
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <EventPage />
  </React.StrictMode>,
);
