import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { memberApi } from '../api/memberApi';
import { getRoleFromAccessToken } from '../../../api/jwtClaims';

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const { setAccessToken } = useAuth();
  const exchanged = useRef(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (exchanged.current) return;
    exchanged.current = true;
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) { setError('소셜 로그인 인증 코드가 없습니다.'); return; }
    let active = true;
    memberApi.exchange(code).then(token => {
      if (!active) return;
      setAccessToken(token);
      localStorage.setItem('isLoginSession', 'true');
      window.history.replaceState({}, '', '/oauth-success');
      // 관리자(토큰의 role = ADMIN)는 행사 관리, 그 외는 마이페이지로
      navigate(getRoleFromAccessToken(token) === 'ADMIN' ? '/admin/events' : '/mypage', { replace: true });
    }).catch(() => {
      if (active) {
        window.history.replaceState({}, '', '/oauth-success');
        setError('소셜 로그인에 실패했습니다. 다시 시도해 주세요.');
      }
    });
    return () => { active = false; };
  }, [navigate, setAccessToken]);
  return <main role="status">{error || '로그인 중...'}{error && <button type="button" onClick={() => navigate('/login', { replace: true })}>로그인 화면으로</button>}</main>;
}
