import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { apiClient, getAccessToken, getRoleFromAccessToken } from '../util/apiClient.js';

const AuthLogin = () => {
  const navigate = useNavigate();
  const exchanged = useRef(false);
  const { setAccessToken } = useAuth();

  useEffect(() => {
    if (exchanged.current) return;
    exchanged.current = true;
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) return;

    apiClient.post('/members/oauth2/exchange?code=' + encodeURIComponent(code))
      .then((response) => {
        const token = getAccessToken(response.data);
        if (!token) throw new Error('accessToken이 없습니다.');
        setAccessToken(token);
        localStorage.setItem('isLoginSession', 'true');
        navigate(getRoleFromAccessToken(token) === 'ADMIN' ? '/admin/events' : '/events');
      })
      .catch((error) => console.error(error.response?.data ?? error));
  }, [setAccessToken, navigate]);

  return <div>로그인 중...</div>;
};

export default AuthLogin;
