import axios from 'axios';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const [accessToken, setAccessToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const refreshPromiseRef = useRef(null);
  const initializedRef = useRef(false);
  const navigate = useNavigate();

  // const newAccessToken = await refreshAccessToken(); 사용 가능
  const refreshAccessToken = useCallback(async () => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const clientId = localStorage.getItem('clientId');
    if (!clientId) {
      console.log('clientId 없음');
      return null;
    }

    refreshPromiseRef.current = (async () => {
      try {
        const res = await axios(`${API_URL}/api/members/reissue`, {
          method: 'POST',
          withCredentials: true,
          data: { clientId },
          validateStatus: () => true,
        });

        if (res.status >= 200 && res.status < 300) {
          const newAccessToken = res.data.data.accessToken;
          setAccessToken(newAccessToken);
          return newAccessToken;
        }

        if (res.status === 401 || res.status === 403) {
          setAccessToken(null);
          localStorage.removeItem('isLoginSession');
        }

        console.error('Refresh Token 재발급 실패:', res.status, res.data);
        throw new Error(`토큰 재발급 실패: ${res.status}`);
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
  }, []);

  // cookie, accessToken, postgresDB refreshToken 삭제
  const logout = async () => {
    const clientId = localStorage.getItem('clientId');

    if (!clientId) {
      console.log('클라이언트 정보가 없습니다.');
      return;
    }

    try {
      const res = await axios(`${API_URL}/api/members/logout`, {
        method: 'DELETE',
        withCredentials: true,
        data: { clientId },
        validateStatus: () => true,
      });

      if (res.status >= 200 && res.status < 300) {
        setAccessToken(null);
        localStorage.removeItem('isLoginSession');
        navigate('/login', { replace: true });
      } else {
        console.log('실패 : ', res.data);
      }
    } catch (err) {
      console.log('오류 발생 : ', err);
    }
  };

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;

    const initailizeAuth = async () => {
      try {
        const isOAuthCallback = window.location.pathname === '/oauth-success';
        if (isOAuthCallback) {
          return;
        }

        const isLogin = localStorage.getItem('isLoginSession');
        if (!isLogin) {
          return;
        }

        await refreshAccessToken();
      } catch (err) {
        console.error(err);
        setAuthLoading(null);
        localStorage.removeItem('isLoginSession');
      } finally {
        setAuthLoading(false);
      }
    };

    initailizeAuth();
  }, [refreshAccessToken]);

  return (
    <AuthContext.Provider
      value={{ accessToken, setAccessToken, refreshAccessToken, logout, authLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내부에서 사용해야 합니다.');
  }

  return context;
}
