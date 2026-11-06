import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import Login from './page/Login';
import AuthLogin from './page/OAuthCallback';
import MyPage from './page/MyPage';
import Signup from './page/Signup';
import PasswordRequest from './page/PasswordRequest';
import PasswordReset from './page/PasswordReset';
import AuthGuard from './auth/AuthGuard';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route>
            <Route element={<AuthGuard />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/oauth-success" element={<AuthLogin />} />
              <Route path="/password/request" element={<PasswordRequest />} />
              <Route path="/password/reset" element={<PasswordReset />} />
            </Route>

            <Route element={<AuthGuard loginRequired />}>
              <Route path="/mypage" element={<MyPage />} />
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
