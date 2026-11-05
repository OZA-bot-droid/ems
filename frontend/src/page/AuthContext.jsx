import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
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
        const res = await fetch(`http://localhost:8080/api/members/reissue`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-type': 'application/json;charset=utf-8',
          },
          body: JSON.stringify({ clientId }),
        });

        const response = await res.json();
        if (!res.ok) {
          setAccessToken(null);
          localStorage.removeItem('isLoginSession');
          throw response;
        } else {
          const newAccessToken = response.data.accessToken;
          setAccessToken(newAccessToken);
          return newAccessToken;
        }
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
  }, []);

  // cookie, accessToken, postgresDB refreshToken 삭제
  const logout = async () => {
    const clientId = localStorage.getItem('clientId');

    try {
      if (clientId) {
        const res = await fetch('http://localhost:8080/api/members/logout', {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId,
          }),
        });

        if (res.ok) {
          navigate('/');
        } else {
          const data = await res.json();
          console.log(data);
        }
      }
    } catch {
      alert('에러 발생');
    } finally {
      setAccessToken(null);
      localStorage.removeItem('isLoginSession');
      navigate('/');
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
