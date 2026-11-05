import axios from 'axios';

const configuredApiUrl = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

// 개발 중에는 Vite proxy가 API 요청을 Gateway로 전달합니다.
// 배포에서는 VITE_API_URL에 설정한 서버 주소를 사용합니다.
export const API_BASE_URL = import.meta.env.DEV
  ? '/api'
  : configuredApiUrl
    ? `${configuredApiUrl}/api`
    : '/api';

export const apiUrl = (path) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { Accept: 'application/json' },
});

export function setApiAccessToken(accessToken) {
  if (accessToken) {
    apiClient.defaults.headers.common.Authorization = 'Bearer ' + accessToken;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
}

export function getAccessToken(responseData) {
  const payload = responseData?.success === true ? responseData.data : responseData;
  return typeof payload === 'string' ? payload : payload?.accessToken ?? null;
}

// Member Service가 발급한 JWT의 role claim을 화면 접근 제어에 사용합니다.
export function getRoleFromAccessToken(accessToken) {
  if (typeof accessToken !== 'string') return null;

  try {
    const encodedPayload = accessToken.split('.')[1];
    if (!encodedPayload) return null;

    const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const bytes = Uint8Array.from(atob(paddedBase64), (character) => character.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    return payload.role === 'USER' || payload.role === 'ADMIN' ? payload.role : null;
  } catch {
    return null;
  }
}

export function getMemberIdFromAccessToken(accessToken) {
  if (typeof accessToken !== 'string') return null;

  try {
    const encodedPayload = accessToken.split('.')[1];
    if (!encodedPayload) return null;
    const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const bytes = Uint8Array.from(atob(paddedBase64), (character) => character.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
