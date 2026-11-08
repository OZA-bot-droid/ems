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
  const channelRef = useRef(null);      // 다른 탭과 메시지를 주고받는 통로
  const accessTokenRef = useRef(null);  // 가장 최근에 갱신된 Access Token 보관
  const refreshVersionRef = useRef(0);  // 다른 탭에서 토큰을 갱신했는지 구분
  const navigate = useNavigate();

  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  useEffect(() => {
    if (!('BroadcastChannel' in window)) return;

    const channel = new BroadcastChannel('ems-auth');
    channelRef.current = channel;

    channel.onmessage = (event) => {
      if (event.data?.type !== 'TOKEN_REFRESHED') return;

      const newToken = event.data.accessToken;
      if (typeof newToken !== 'string' || !newToken) return;

      accessTokenRef.current = newToken;
      refreshVersionRef.current += 1;
      setAccessToken(newToken);
    };

    return () => {
      channel.close();

      if (channelRef.current === channel) {
        channelRef.current = null;
      }
    };
  }, []);

  // const newAccessToken = await refreshAccessToken(); 사용 가능
  const refreshAccessToken = useCallback(async (failedToken = null) => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const clientId = localStorage.getItem('clientId');
    if (!clientId) return null;

    // 재발급 시작 시점의 버전
    const startVersion = refreshVersionRef.current;

    // 다른 탭이 이미 갱신했다면 해당 토큰 사용
    const getUpdatedToken = () => {
      const latest = accessTokenRef.current;
      if (!latest) return null;

      if (failedToken && latest !== failedToken) {
        return latest;
      }

      if (!failedToken && refreshVersionRef.current !== startVersion) {
        return latest;
      }

      return null;
    };

    const requestReissue = async () => {
      const res = await axios(`${API_URL}/api/members/reissue`, {
        method: 'POST',
        withCredentials: true,
        data: { clientId },
        validateStatus: () => true,
      });

      if (res.status >= 200 && res.status < 300) {
        const newToken = res.data.data.accessToken;

        accessTokenRef.current = newToken;
        refreshVersionRef.current += 1;
        setAccessToken(newToken);

        channelRef.current?.postMessage({
          type: 'TOKEN_REFRESHED',
          accessToken: newToken,
        });

        return newToken;
      }

      if (res.status === 401 || res.status === 403) {
        accessTokenRef.current = null;
        setAccessToken(null);
        localStorage.removeItem('isLoginSession');
      }

      throw new Error(`토큰 재발급 실패: ${res.status}`);
    };

    refreshPromiseRef.current = (async () => {
      const updated = getUpdatedToken();
      if (updated) return updated;

      // Web Locks 미지원 브라우저에서는 기존 방식 사용
      if (!navigator.locks?.request) {
        return requestReissue();
      }

      return navigator.locks.request('ems-refresh-token', async () => {
        // 다른 탭의 재발급 완료 후 잠금을 획득했다면
        // 새 토큰을 사용하고 서버에 다시 요청하지 않음
        const latest = getUpdatedToken();
        if (latest) return latest;

        return requestReissue();
      });
    })().finally(() => {
      refreshPromiseRef.current = null;
    });

    return refreshPromiseRef.current;
  }, [API_URL]);

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
