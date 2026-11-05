import { useCallback } from 'react';
import { useAuth } from '../page/AuthContext';
import { apiClient } from './apiClient.js';

export function useApiUtil() {
  const { accessToken, setAccessToken, refreshAccessToken } = useAuth();
  const apiReq = useCallback(async (path, options = {}) => {
    const { body, ...requestOptions } = options;
    const sendRequest = (token) => apiClient.request({
      url: path,
      ...requestOptions,
      data: body ?? requestOptions.data,
      headers: { ...requestOptions.headers, ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    });
    try {
      return await sendRequest(accessToken);
    } catch (error) {
      if (error.response?.status !== 401) throw error;
      const newAccessToken = await refreshAccessToken();
      if (typeof newAccessToken !== 'string') {
        setAccessToken(null);
        return null;
      }
      return sendRequest(newAccessToken);
    }
  }, [accessToken, refreshAccessToken, setAccessToken]);
  return apiReq;
}
