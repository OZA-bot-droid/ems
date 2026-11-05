import axios from 'axios';

const configuredApiUrl = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

// 팀 공지 기준: 서버 주소는 .env 의 VITE_API_URL 에서 읽고, axios가 그 주소(Gateway)로 직접 요청합니다.
//   - 로컬: .env.development → http://localhost:8080 → http://localhost:8080/api/...
//   - 배포: .env.production 에서 비워 두면 같은 주소의 /api (nginx가 Gateway로 넘김)
export const API_BASE_URL = configuredApiUrl ? `${configuredApiUrl}/api` : '/api';

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
