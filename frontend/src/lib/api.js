const ROOT = '/api';
export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}
let unauthorizedHandler = () => {};
export function onUnauthorized(fn) {
  unauthorizedHandler = fn;
}
export async function request(path, { method = 'GET', body, token, signal } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort, { once: true });
  try {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = 'Bearer ' + token;
    const response = await fetch(ROOT + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const raw = await response.text();
    let data;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = { message: raw };
    }
    if (!response.ok) {
      if (response.status === 401 && token) unauthorizedHandler();
      throw new ApiError(
        data?.message ||
          (response.status === 404
            ? 'API가 아직 구현되지 않았거나 주소가 다릅니다.'
            : '요청 처리에 실패했습니다.'),
        response.status,
        data?.code,
      );
    }
    return data;
  } catch (e) {
    if (e.name === 'AbortError') throw new ApiError('요청 시간이 초과되었거나 취소되었습니다.', 0);
    if (e instanceof ApiError) throw e;
    throw new ApiError('서버에 연결할 수 없습니다. Gateway와 서비스 상태를 확인하세요.', 0);
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', onAbort);
  }
}
export const memberApi = {
  login: (credentials) => request('/members/login', { method: 'POST', body: credentials }),
  register: (values) => request('/members/register', { method: 'POST', body: values }),
  me: (token) => request('/members/me', { token }),
};
export const eventApi = {
  list: () => request('/events'),
  detail: (id) => request('/events/' + encodeURIComponent(id)),
  sessions: (id) => request('/events/' + encodeURIComponent(id) + '/sessions'),
  create: (token, values) => request('/events', { method: 'POST', token, body: values }),
  update: (token, id, values) =>
    request('/events/' + encodeURIComponent(id), { method: 'PATCH', token, body: values }),
  createSession: (token, id, values) =>
    request('/events/' + encodeURIComponent(id) + '/sessions', {
      method: 'POST',
      token,
      body: values,
    }),
  apply: (token, id) =>
    request('/events/' + encodeURIComponent(id) + '/registrations', { method: 'POST', token }),
  mine: (token) => request('/events/registrations/me', { token }),
  registration: (token, id, action) =>
    request('/events/registrations/' + encodeURIComponent(id) + '/' + action, {
      method: 'PATCH',
      token,
    }),
  summary: (token, id) => request('/events/' + encodeURIComponent(id) + '/summary', { token }),
};
export const interactionApi = {
  createPoll: (token, values) =>
    request('/interactions/polls', { method: 'POST', token, body: values }),
  vote: (token, id, values) =>
    request('/interactions/polls/' + encodeURIComponent(id) + '/votes', {
      method: 'POST',
      token,
      body: values,
    }),
  results: (token, id) =>
    request('/interactions/polls/' + encodeURIComponent(id) + '/results', { token }),
};
export function asItems(data) {
  if (Array.isArray(data)) return data;
  return data?.content || data?.items || data?.data || [];
}
