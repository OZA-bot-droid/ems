// 백엔드에 요청을 보내는 공통 함수 모음 (주문서 양식)
// 모든 주소는 /api 로 시작합니다. Vite가 Gateway(8080)로 넘겨 주고,
// Gateway가 /api 를 떼서 각 서비스로 보냅니다.

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
}

// 행사·세션 API (백엔드 Controller와 1:1로 대응)
export const eventApi = {
  list: ({ status, page = 0, size = 10 } = {}) => {
    const query = new URLSearchParams({ page, size });
    if (status) query.set('status', status);
    return request(`/events?${query}`);
  },
  get: (eventId) => request(`/events/${eventId}`),
  create: (body) => request('/events', { method: 'POST', body }),
  update: (eventId, body) => request(`/events/${eventId}`, { method: 'PATCH', body }),
  remove: (eventId) => request(`/events/${eventId}`, { method: 'DELETE' }),
  sessions: (eventId) => request(`/events/${eventId}/sessions`),
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
