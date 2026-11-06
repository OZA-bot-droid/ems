import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useApiUtil } from '../hook/apiUtil';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const exchanged = useRef(false);
  const { setAccessToken } = useAuth();
  const apiReq = useApiUtil();

  useEffect(() => {
    // 이미 토큰 교환을 시도했다면 다시 실행하지 않음
    if (exchanged.current) {
      return;
    }
    exchanged.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) {
      navigate('/?error=login_failed', { replace: true });
      return;
    }

    apiReq(`/api/members/oauth2/exchange?code=${encodeURIComponent(code)}`, {
      method: 'POST',
      withCredentials: true,
    })
      .then(async (res) => {
        console.log(res);
        if (res.status < 200 || res.status >= 300) {
          throw new Error(res.data?.message || '소셜 로그인 토큰 교환 실패');
        } else {
          return res.data.data.accessToken;
        }
      })
      .then((accessToken) => {
        if (typeof accessToken !== 'string' || !accessToken) {
          throw new Error('accessToken이 없습니다.');
        } else {
          setAccessToken(accessToken);
          localStorage.setItem('isLoginSession', 'true');
          navigate('/main', { replace: true });
        }
      })
      .catch((error) => {
        console.error(error);
        navigate('/?error=login_failed', { replace: true });
      });
  }, [setAccessToken, navigate]);

  return <div>로그인 중...</div>;
};

export default OAuthCallback;
