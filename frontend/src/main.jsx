import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './page/AuthContext.jsx';
import AuthLogin from './page/AuthLogin.jsx';
import Login from './page/Login.jsx';
import LoginSuccess from './page/LoginSuccess.jsx';
import Signup from './page/Signup.jsx';
import EventDiscoveryPage from './pages/user/EventDiscoveryPage.jsx';
import RegistrationPage from './pages/user/RegistrationPage.jsx';
import AdminEventPage from './pages/admin/AdminEventPage.jsx';
import AdminSessionPage from './pages/admin/AdminSessionPage.jsx';
import AdminApprovalPage from './pages/admin/AdminApprovalPage.jsx';
import { apiClient } from './util/apiClient.js';
import { useAuth } from './page/AuthContext.jsx';
import './style.css';

function BootstrapPage() {
  const [data, setData] = React.useState({});

  React.useEffect(() => {
    Promise.all(
      ['members', 'events', 'interactions'].map(async (service) => {
        try {
          const response = await apiClient.get('/' + service + '/ping');
          return [service, response.data];
        } catch (error) {
          const message = error.response ? 'HTTP ' + error.response.status : error.message;
          return [service, { status: 'ERROR', error: message }];
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
        {['members', 'events', 'interactions'].map((service) => (
          <article key={service} className="rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold">{service}</h2>
            <p className="mt-2 text-sm text-slate-500">{data[service]?.status || 'Checking...'}</p>
          </article>
        ))}
      </section>
      <a
        className="mt-8 inline-block rounded-lg bg-slate-900 px-4 py-2 text-white"
        href="/login"
      >
        로그인
      </a>
      <p className="mt-8 text-sm text-slate-500">
        현재는 서비스 연결 상태와 후속 구현 내용을 확인하는 화면입니다.
      </p>
    </main>
  );
}

function RequireRole({ allowedRole, children }) {
  const { accessToken, role, authLoading } = useAuth();

  if (authLoading) {
    return <p className="p-8 text-slate-600">로그인 상태를 확인하고 있어요…</p>;
  }

  if (!accessToken || !role) {
    return <Navigate to="/login" replace />;
  }

  const allowedRoles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
  if (!allowedRoles.includes(role)) {
    return <Navigate to={role === 'ADMIN' ? '/admin/events' : '/events'} replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/oauth-success" element={<AuthLogin />} />
          <Route path="/login/success" element={<RequireRole allowedRole={['USER', 'ADMIN']}><LoginSuccess /></RequireRole>} />
          <Route path="/events" element={<RequireRole allowedRole="USER"><EventDiscoveryPage /></RequireRole>} />
          <Route path="/registrations" element={<RequireRole allowedRole="USER"><RegistrationPage /></RequireRole>} />
          <Route path="/admin/events" element={<RequireRole allowedRole="ADMIN"><AdminEventPage /></RequireRole>} />
          <Route path="/admin/sessions" element={<RequireRole allowedRole="ADMIN"><AdminSessionPage /></RequireRole>} />
          <Route path="/admin/approvals" element={<RequireRole allowedRole="ADMIN"><AdminApprovalPage /></RequireRole>} />
          <Route path="/bootstrap" element={<BootstrapPage />} />
          <Route path="*" element={<BootstrapPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
