// 백엔드에 요청을 보내는 공통 함수 모음 (주문서 양식)
// 요청은 axios로 보냅니다. 서버 주소는 코드에 적지 않고 환경변수 VITE_API_URL 에서 읽습니다.
//   - 로컬(npm run dev): .env.development → http://localhost:8080 (Gateway)
//   - 배포(npm run build): .env.production → 비워 둠 → 같은 주소의 /api 로 요청 (nginx가 Gateway로 넘김)
// Gateway가 /api 를 떼서 각 서비스로 보냅니다.
import axios from 'axios';

// 끝에 / 가 붙어 있어도 // 가 두 번 생기지 않게 잘라 냄
const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

// 모든 요청이 공통으로 쓰는 axios 설정 (주소 앞부분 + 쿠키 동봉)
export const http = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true, // 다른 포트(5173→8080)로 보내도 refreshToken 쿠키를 같이 보냄 (토큰 재발급용)
});

import { apiClient } from './util/apiClient.js';

// 서버가 보내는 에러 {code, message} 를 담는 상자
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// 모든 요청이 지나가는 함수
<<<<<<< HEAD
async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let response;
  try {
    // axios는 body(data)를 알아서 JSON으로 바꾸고 Content-Type도 붙여 줌
    response = await http.request({ url: path, method, headers, data: body });
  } catch (error) {
    // 응답 자체가 없음 = 서버가 꺼졌거나 주소가 틀림
    if (!error.response) {
      throw new ApiError(
        0,
        'NETWORK_ERROR',
        '서버에 연결할 수 없습니다. Gateway와 서비스가 켜져 있는지 확인하세요.',
      );
    }
    // axios는 2xx가 아니면 여기(catch)로 옴 → 서버가 보낸 에러 {code, message} 꺼내기
    const { status, data } = error.response;
    // 토큰이 만료·위조로 거절되면 로그아웃 상태로 바꿈 (다시 로그인하도록)
    if (status === 401 && auth && accessToken) setAccessToken(null);
    throw new ApiError(
      status,
      data?.code ?? 'UNKNOWN',
      data?.message ?? `요청이 실패했습니다 (HTTP ${status})`,
    );
  }

  if (response.status === 204) return null; // 삭제 성공: 본문 없음
  const data = response.data === '' ? null : response.data; // axios가 JSON을 이미 객체로 바꿔 줌
  // 성공 응답은 { success, data, message, ... } 로 감싸져 온다 (docs/api-response-standard.md).
  // 화면 코드는 알맹이(data)만 쓰면 되므로 여기서 한 번만 벗겨 준다.
  if (data && data.success === true && 'data' in data) return data.data;
  return data;
=======
async function request(path, { method = 'GET', body } = {}) {
  try {
    const response = await apiClient.request({ url: path, method, data: body });
    if (response.status === 204) return null;
    const data = response.data;
    if (data && data.success === true && 'data' in data) return data.data;
    return data;
  } catch (error) {
    const status = error.response?.status ?? 0;
    const data = error.response?.data;
    throw new ApiError(
      status,
      data?.code ?? (status === 0 ? 'NETWORK_ERROR' : 'UNKNOWN'),
      data?.message ?? (status === 0
        ? '서버에 연결할 수 없습니다. Gateway와 서비스가 켜져 있는지 확인하세요.'
        : '요청이 실패했습니다 (HTTP ' + status + ')'),
    );
  }
>>>>>>> origin/feature/Event-Service
}

// 행사·세션 API (백엔드 Controller와 1:1로 대응)
export const eventApi = {
  // sort: 'startsAt,asc' 처럼 "칸,방향" (Spring Pageable 규칙). 안 보내면 서버 기본(시작일 빠른 순)
  list: ({ status, page = 0, size = 10, sort } = {}) => {
    const query = new URLSearchParams({ page, size });
    if (status) query.set('status', status);
    if (sort) query.set('sort', sort);
    return request(`/events?${query}`);
  },
  // 관리자: 내가 만든 행사만 (모든 상태, 다른 관리자의 행사 제외)
  mine: ({ status, page = 0, size = 10, sort } = {}) => {
    const query = new URLSearchParams({ page, size });
    if (status) query.set('status', status);
    if (sort) query.set('sort', sort);
    return request(`/events/mine?${query}`);
  },
  get: (eventId) => request(`/events/${eventId}`),
  create: (body) => request('/events', { method: 'POST', body }),
  update: (eventId, body) => request(`/events/${eventId}`, { method: 'PATCH', body }),
  remove: (eventId) => request(`/events/${eventId}`, { method: 'DELETE' }),
  sessions: (eventId) => request(`/events/${eventId}/sessions`),
  // 관리자(행사 주인)용 세션 목록: 작성 중(DRAFT) 행사도 조회됨 (로그인 필수 경로)
  manageSessions: (eventId) => request(`/events/${eventId}/sessions/manage`),
  createSession: (eventId, body) => request(`/events/${eventId}/sessions`, { method: 'POST', body }),
  updateSession: (eventId, sessionId, body) =>
    request(`/events/${eventId}/sessions/${sessionId}`, { method: 'PATCH', body }),
  removeSession: (eventId, sessionId) =>
    request(`/events/${eventId}/sessions/${sessionId}`, { method: 'DELETE' }),
};

// 참가 신청 API
const unwrapSuccessData = (response) =>
  response?.success === true && Object.hasOwn(response, 'data') ? response.data : response;

export const registrationApi = {
  apply: async (eventId) =>
    unwrapSuccessData(await request(`/events/${eventId}/registrations`, { method: 'POST' })),
  mine: ({ page = 0, size = 20 } = {}) =>
    request(`/events/registrations/me?page=${page}&size=${size}`),
  adminList: ({ status = 'PENDING', page = 0, size = 20 } = {}) => {
    const query = new URLSearchParams({ status, page, size });
    return request(`/events/registrations?${query}`);
  },
  approve: (registrationId) =>
    request(`/events/registrations/${registrationId}/approve`, { method: 'PATCH' }),
  reject: (registrationId) =>
    request(`/events/registrations/${registrationId}/reject`, { method: 'PATCH' }),
  cancel: async (registrationId) =>
    unwrapSuccessData(await request(`/events/registrations/${registrationId}/cancel`, { method: 'PATCH' })),
  // 관리자: 행사별 신청 현황 (대기·승인·거절·취소 건수)
  summary: (eventId) => request(`/events/${eventId}/summary`),
};
