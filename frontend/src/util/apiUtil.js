import { useCallback } from 'react';
import { useAuth } from '../page/AuthContext';

export function useApiUtil() {
  const BACKEND_API_URL = 'http://localhost:8080/api';
  const { accessToken, setAccessToken, refreshAccessToken } = useAuth();

  const apiReq = useCallback(
    async (path, options = {}) => {
      const sendRequest = async (token) => {
        const headers = new Headers(options.headers || {});

        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }

        return fetch(`${BACKEND_API_URL}${path}`, {
          ...options,
          headers,
        });
      };

      // accessToken을 요청
      const res = await sendRequest(accessToken);
      if (res.ok || res.status !== 401) {
        return res;
      }

      // 진행 중인 재발급 요청 기다림
      const newAccessToken = await refreshAccessToken();

      // 재발급 실패
      // result가 string형이 아닌지 확인
      if (typeof newAccessToken !== 'string') {
        setAccessToken(null);
        return result;
      }

      // 재발급 성공
      return sendRequest(newAccessToken);
    },
    [accessToken, refreshAccessToken, setAccessToken],
  );

  return apiReq;
}
