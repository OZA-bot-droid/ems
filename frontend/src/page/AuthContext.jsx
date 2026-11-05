import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, getAccessToken, getMemberIdFromAccessToken, getRoleFromAccessToken, setApiAccessToken } from '../util/apiClient.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setRawAccessToken] = useState(null);
  const [role, setRole] = useState(null);
  const [memberId, setMemberId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const refreshPromiseRef = useRef(null);
  const initializedRef = useRef(false);
  const navigate = useNavigate();

  const setAccessToken = useCallback((token) => {
    setRawAccessToken(token);
    setRole(getRoleFromAccessToken(token));
    setMemberId(getMemberIdFromAccessToken(token));
    setApiAccessToken(token);
  }, []);

  const refreshAccessToken = useCallback(async () => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current;
    const clientId = localStorage.getItem('clientId');
    if (!clientId) return null;

    refreshPromiseRef.current = (async () => {
      try {
        const response = await apiClient.post('/members/reissue', { clientId });
        const token = getAccessToken(response.data);
        if (!token) throw new Error('토큰 재발급 응답에 access token이 없습니다.');
        setAccessToken(token);
        return token;
      } catch (error) {
        setAccessToken(null);
        localStorage.removeItem('isLoginSession');
        throw error;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();
    return refreshPromiseRef.current;
  }, []);

  const logout = async () => {
    const clientId = localStorage.getItem('clientId');
    try {
      if (clientId) await apiClient.delete('/members/logout', { data: { clientId } });
    } catch (error) {
      console.error(error.response?.data ?? error);
      alert('로그아웃 요청에 실패했습니다.');
    } finally {
      setAccessToken(null);
      localStorage.removeItem('isLoginSession');
      navigate('/login');
    }
  };

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const initializeAuth = async () => {
      try {
        if (window.location.pathname !== '/oauth-success' && localStorage.getItem('isLoginSession')) {
          await refreshAccessToken();
        }
      } catch (error) {
        console.error(error);
        localStorage.removeItem('isLoginSession');
      } finally {
        setAuthLoading(false);
      }
    };
    initializeAuth();
  }, [refreshAccessToken]);

  return (
    <AuthContext.Provider value={{ accessToken, role, memberId, setAccessToken, refreshAccessToken, logout, authLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth는 AuthProvider 내부에서 사용해야 합니다.');
  return context;
}
