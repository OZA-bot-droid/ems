import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const AuthLogin = () => {
  const navigate = useNavigate();
  const exchanged = useRef(false);
  const { setAccessToken } = useAuth();

  useEffect(() => {
    // 이미 토큰 교환을 시도했다면 다시 실행하지 않음
    if (exchanged.current) {
      return;
    }
    exchanged.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (!code) {
      return;
    }

    fetch(`http://localhost:8080/api/members/oauth2/exchange?code=${code}`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('소셜 로그인 토큰 교환 실패');
        } else {
          return res.text();
        }
      })
      .then((data) => {
        if (!data) {
          throw new Error('accessToken이 없습니다.');
        } else {
          setAccessToken(data.data.accessToken);
          localStorage.setItem('isLoginSession', 'true');
          navigate('/login/success');
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }, [setAccessToken, navigate]);

  return <div>로그인 중...</div>;
};

export default AuthLogin;
