import axios from 'axios';
import { tokenStore } from './tokenStore';
import { normalizeApiError } from './apiError';
import { getClientId } from '../features/member/utils/getClientId';

export const publicApi = axios.create({ baseURL: '/api', withCredentials: true, timeout: 10000 });
export const api = axios.create({ baseURL: '/api', withCredentials: true, timeout: 10000 });
let refreshPromise = null;
const NO_REFRESH = new Set([
  '/members/login',
  '/members/register',
  '/members/reissue',
  '/members/logout',
  '/members/oauth2/exchange',
]);

export async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const response = await publicApi.post('/members/reissue', { clientId: getClientId() });
      const token = response.data?.data?.accessToken;
      if (response.data?.success !== true || !token || typeof token !== 'string')
        throw new Error('잘못된 토큰 재발급 응답');
      tokenStore.set(token);
      return token;
    } catch (error) {
      tokenStore.clear();
      throw normalizeApiError(error);
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const path = String(config?.url || '').split('?')[0];
    const isProtected = !NO_REFRESH.has(path) && !config?.skipAuthRefresh;
    // Only refresh if an existing Access Token was sent and authentication failed.
    // An initial unauthenticated protected request should surface its 401.
    if (
      error.response?.status === 401 &&
      config &&
      isProtected &&
      !config._retry &&
      config.headers?.get?.('Authorization')
    ) {
      config._retry = true;
      try {
        const token = await refreshAccessToken();
        config.headers.set('Authorization', `Bearer ${token}`);
        return await api(config);
      } catch (refreshError) {
        throw normalizeApiError(refreshError);
      }
    }
    throw normalizeApiError(error);
  },
);
