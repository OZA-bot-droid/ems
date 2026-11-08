import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import AuthGuard from './auth/AuthGuard';
import Home from './page/Home';
import Signup from './page/Signup';
import Login from './page/Login';
import AuthLogin from './page/OAuthCallback';
import MyPage from './page/MyPage';
import PasswordRequest from './page/PasswordRequest';
import PasswordReset from './page/PasswordReset';
import PasswordChange from './page/PasswordChange';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route>
            <Route path="/" element={<Home />} />

            <Route element={<AuthGuard />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/oauth-success" element={<AuthLogin />} />
              <Route path="/password/request" element={<PasswordRequest />} />
              <Route path="/password/reset" element={<PasswordReset />} />
            </Route>

            <Route element={<AuthGuard loginRequired />}>
              <Route path="/mypage" element={<MyPage />} />
              <Route path="/password/change" element={<PasswordChange />} />
            </Route>
          </Route>
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
