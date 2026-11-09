import { createContext, useCallback, useEffect, useState } from 'react';
import { tokenStore } from '../../../api/tokenStore';
import { refreshAccessToken } from '../../../api/axiosInstance';
import { memberApi } from '../api/memberApi';
import { getMemberIdFromAccessToken, getRoleFromAccessToken } from '../../../api/jwtClaims';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setTokenState] = useState(tokenStore.get());
  const [authLoading, setAuthLoading] = useState(true);
  const [role, setRole] = useState(getRoleFromAccessToken(tokenStore.get()));
  const [memberId, setMemberId] = useState(getMemberIdFromAccessToken(tokenStore.get()));

  useEffect(() => tokenStore.subscribe(token => {
    setTokenState(token);
    setRole(getRoleFromAccessToken(token));
    setMemberId(getMemberIdFromAccessToken(token));
  }), []);

  const setAccessToken = useCallback(token => { tokenStore.set(token); if (token) setAuthLoading(false); }, []);
  const refresh = useCallback(() => refreshAccessToken(), []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // Avoid a premature refresh before OAuth2 code exchange or for logged-out sessions.
        if (window.location.pathname === '/oauth-success' || localStorage.getItem('isLoginSession') !== 'true') return;
        // Reload: recover Access Token from HttpOnly Refresh Cookie, not localStorage.
        await refreshAccessToken();
        const me = await memberApi.me();
        if (active) {
          setRole(me?.role || getRoleFromAccessToken(tokenStore.get()));
          setMemberId(me?.id ?? me?.memberId ?? getMemberIdFromAccessToken(tokenStore.get()));
        }
      } catch (error) {
        if (active) {
          tokenStore.clear();
          setRole(null);
          setMemberId(null);
          if (error.status === 401 || error.status === 403) localStorage.removeItem('isLoginSession');
        }
      } finally { if (active) setAuthLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  const login = async payload => {
    const token = await memberApi.login(payload);
    localStorage.setItem('isLoginSession', 'true');
    setAuthLoading(false);
    setAccessToken(token);
    const me = await memberApi.me().catch(() => null);
    if (me) {
      setRole(me.role || getRoleFromAccessToken(token));
      setMemberId(me.id ?? me.memberId ?? getMemberIdFromAccessToken(token));
    }
    return token;
  };
  const logout = async () => {
    try { await memberApi.logout(); }
    finally {
      tokenStore.clear();
      setRole(null);
      setMemberId(null);
      localStorage.removeItem('isLoginSession');
    }
  };

  return <AuthContext.Provider value={{
    accessToken, authLoading, role, memberId, setAccessToken,
    login, logout, refreshAccessToken: refresh,
  }}>{children}</AuthContext.Provider>;
}
