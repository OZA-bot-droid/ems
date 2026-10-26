// 백엔드에 요청을 보내는 공통 함수 모음 (주문서 양식)
// 모든 주소는 /api 로 시작합니다. Vite가 Gateway(8080)로 넘겨 주고,
// Gateway가 /api 를 떼서 각 서비스로 보냅니다.

// ⚠️ 임시 사용자: 로그인(JWT)이 완성되기 전까지만 씁니다.
// 로그인이 붙으면 Gateway가 X-User-Id / X-User-Role 을 대신 넣어 주므로 이 부분은 지웁니다.
export const DEV_USERS = {
  ADMIN: { id: '1', role: 'ADMIN' },
  USER: { id: '2', role: 'USER' },
};
let currentUser = DEV_USERS.ADMIN;
export function setDevUser(role) {
  currentUser = DEV_USERS[role];
}
export function getDevUser() {
  return currentUser;
}

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
  const headers = {
    'X-User-Id': currentUser.id,
    'X-User-Role': currentUser.role,
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch('/api' + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', '서버에 연결할 수 없습니다. Gateway와 서비스가 켜져 있는지 확인하세요.');
  }

  if (response.status === 204) return null; // 삭제 성공: 본문 없음
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.code ?? 'UNKNOWN',
      data?.message ?? `요청이 실패했습니다 (HTTP ${response.status})`,
    );
  }
  return data;
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
};
