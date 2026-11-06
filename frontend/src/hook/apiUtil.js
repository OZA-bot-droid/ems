import { useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import axios from 'axios';

export function useApiUtil() {
  // 환경변수 값 주입
  const API_URL = import.meta.env.VITE_API_URL;
  const { accessToken, refreshAccessToken } = useAuth();

  const apiReq = useCallback(
    async (path, options = {}) => {
      const sendRequest = async (token) => {
        return axios(`${API_URL}${path}`, {
          ...options,
          headers: {
            ...options.headers,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          validateStatus: () => true,
        });
      };

      // accessToken을 요청
      const res = await sendRequest(accessToken);
      if (!accessToken || res.status !== 401) {
        return res;
      }

      let newAccessToken;
      try {
        // 진행 중인 재발급 요청 기다림
        newAccessToken = await refreshAccessToken();
      } catch (err) {
        console.error(err);
        return res;
      }

      // 재발급 실패
      // result가 string형이 아닌지 확인
      if (typeof newAccessToken !== 'string') {
        return res;
      }

      // 재발급 성공
      return sendRequest(newAccessToken);
    },
    [accessToken, refreshAccessToken],
  );

  return apiReq;
}
