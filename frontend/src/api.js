// 백엔드에 요청을 보내는 공통 함수 모음 (주문서 양식)
// 모든 주소는 /api 로 시작합니다. Vite가 Gateway(8080)로 넘겨 주고,
// Gateway가 /api 를 떼서 각 서비스로 보냅니다.

// ===== 로그인 (JWT) =====
// 로그인하면 Member Service가 Access Token(회원증)을 줍니다. 요청마다 Authorization: Bearer 토큰으로 보내고,
// Gateway가 토큰을 검사한 뒤 X-Member-Id / X-User-Role 을 대신 붙여 줍니다. (화면이 직접 X-헤더를 보내면 안 됨)
// 토큰은 sessionStorage에 둡니다 → 탭을 닫으면 사라짐. 정식 로그인 화면(member-front)이 붙으면 setAccessToken()만 부르면 됩니다.
const TOKEN_KEY = 'ems-access-token';
const EMAIL_KEY = 'ems-login-email';
const GUEST = { id: null, role: null, email: null }; // 로그인 안 한 손님

const storage = typeof window === 'undefined' ? null : window.sessionStorage;
let accessToken = storage?.getItem(TOKEN_KEY) ?? null;
const listeners = new Set();

// 토큰 가운데 부분(payload)을 열어 sub(회원 번호)·role·exp(만료)를 읽음
// ※ 화면에서 버튼을 보일지 정하는 용도. 진짜 권한 검사는 Gateway와 서버가 다시 함
function readToken(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

let currentUser = toUser(accessToken);
function toUser(token) {
  const payload = token && readToken(token);
  if (!payload || (payload.exp && payload.exp * 1000 <= Date.now())) return GUEST; // 없거나 만료
  return { id: payload.sub, role: payload.role, email: storage?.getItem(EMAIL_KEY) ?? null };
}

export function setAccessToken(token, email = null) {
  accessToken = token || null;
  if (accessToken) {
    storage?.setItem(TOKEN_KEY, accessToken);
    if (email) storage?.setItem(EMAIL_KEY, email);
  } else {
    storage?.removeItem(TOKEN_KEY);
    storage?.removeItem(EMAIL_KEY);
  }
  currentUser = toUser(accessToken);
  listeners.forEach((fn) => fn());
}

// 지금 로그인한 사람 { id, role, email }. 로그인 안 했으면 id·role이 null
export function getCurrentUser() {
  return currentUser;
}
// 로그인 상태가 바뀌면 알려 달라고 등록 (화면 새로 그리기용). 반환값을 부르면 등록 해제
export function subscribeAuth(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// 이 브라우저의 기기 번호 (Refresh Token이 기기별로 묶임). member-front와 같은 키를 씀
function getClientId() {
  let id = window.localStorage.getItem('clientId');
  if (!id) {
    id = window.crypto.randomUUID();
    window.localStorage.setItem('clientId', id);
  }
  return id;
}

export async function login(email, password) {
  const data = await request('/members/login', {
    method: 'POST',
    body: { email, password, clientId: getClientId() },
    auth: false,
  });
  setAccessToken(data?.accessToken, email);
  return getCurrentUser();
}

export async function logout() {
  try {
    await request('/members/logout', { method: 'DELETE', body: { clientId: getClientId() }, auth: false });
  } catch {
    // 서버 쪽 로그아웃이 실패해도 화면에서는 토큰을 지움
  }
  setAccessToken(null);
}

// ⚠️ 예전 개발용 함수 (다른 화면이 아직 부르고 있어서 남겨 둠)
// getDevUser = getCurrentUser 와 같음. setDevUser 는 이제 아무것도 안 함 (역할은 로그인한 계정으로 정해짐)
export const getDevUser = getCurrentUser;
export function setDevUser() {}

// 서버가 보내는 에러 {code, message} 를 담는 상자
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// 모든 요청이 지나가는 함수
async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch('/api' + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      '서버에 연결할 수 없습니다. Gateway와 서비스가 켜져 있는지 확인하세요.',
    );
  }

  if (response.status === 204) return null; // 삭제 성공: 본문 없음
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    // 토큰이 만료·위조로 거절되면 로그아웃 상태로 바꿈 (다시 로그인하도록)
    if (response.status === 401 && auth && accessToken) setAccessToken(null);
    throw new ApiError(
      response.status,
      data?.code ?? 'UNKNOWN',
      data?.message ?? `요청이 실패했습니다 (HTTP ${response.status})`,
    );
  }
  // 성공 응답은 { success, data, message, ... } 로 감싸져 온다 (docs/api-response-standard.md).
  // 화면 코드는 알맹이(data)만 쓰면 되므로 여기서 한 번만 벗겨 준다.
  if (data && data.success === true && 'data' in data) return data.data;
  return data;
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
  cancel: async (registrationId) =>
    unwrapSuccessData(await request(`/events/registrations/${registrationId}/cancel`, { method: 'PATCH' })),
  // 관리자: 행사별 신청 현황 (대기·승인·거절·취소 건수)
  summary: (eventId) => request(`/events/${eventId}/summary`),
};
