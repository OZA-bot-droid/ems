// 파일 기능: React 앱과 로그인·투표 화면 라우팅을 초기화합니다.

import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import Sidebar from './components/layout/Sidebar.jsx';
import Voting from './pages/voting/Voting.jsx';
import PollManagement from './pages/pollManagement/PollManagement.jsx';
import styles from './pages/voting/Voting.module.scss';

import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './page/AuthContext';
import Login from './page/Login';
import AuthLogin from './page/AuthLogin';
import LoginSuccess from './page/LoginSuccess';
import Signup from './page/Signup';

// function Home() {
//   return (
//     <div className={styles.layout}>
//       <Sidebar />
//       <main className={styles.main}>
//         <header className={styles.pageHeader}>
//           <div>
//             <h1>EMS 이벤트 플랫폼</h1>
//             <p>왼쪽 메뉴에서 실시간 투표 또는 투표 관리를 선택해 주세요.</p>
//           </div>
//         </header>
//       </main>
//     </div>
//   );
// }

// function App() {
//   const path = window.location.pathname.replace(/\/$/, '') || '/';
//   if (path === '/polls/vote') return <Voting />;
//   if (path === '/polls/manage') return <PollManagement />;
//   return (
//     <BrowserRouter>
//       <AuthProvider>
//         <Routes>
//           <Route>
//             <Home />
//             <Route path="/" element={<Login />} />
//             <Route path="/signup" element={<Signup />} />
//             <Route path="/oauth-success" element={<AuthLogin />} />
//             <Route path="/login/success" element={<LoginSuccess />} />
//           </Route>
//         </Routes>
//       </AuthProvider>
//     </BrowserRouter>
//   );
// }

// 함수 역할: 홈 화면 안내를 렌더링합니다.
function Home() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <header className={styles.pageHeader}>
          <div>
            <h1>EMS 이벤트 플랫폼</h1>
            <p>왼쪽 메뉴에서 실시간 투표 또는 투표 관리를 선택해 주세요.</p>
          </div>
        </header>
      </main>
    </div>
  );
}

// 함수 역할: 로그인과 투표 관련 페이지 경로를 설정합니다.
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* 메인 화면 */}
          <Route path="/" element={<Home />} />

          {/* 실시간 투표 */}
          <Route path="/polls/vote" element={<Voting />} />

          {/* 투표 관리 */}
          <Route path="/polls/manage" element={<PollManagement />} />

          {/* 로그인 */}
          <Route path="/login" element={<Login />} />

          {/* 회원가입 */}
          <Route path="/signup" element={<Signup />} />

          {/* OAuth 인증 */}
          <Route path="/oauth-success" element={<AuthLogin />} />

          {/* 로그인 성공 */}
          <Route path="/login/success" element={<LoginSuccess />} />
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
