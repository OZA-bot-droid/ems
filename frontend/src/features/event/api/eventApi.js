import { api } from '../../../api/axiosInstance.js';
import { unwrap } from '../../../api/apiError.js';

const request = async (method, path, data, params) =>
  unwrap(await api.request({ method, url: path, data, params }));

/** Single Event API contract; all routes use shared Axios and token refresh. */
export const eventApi = {
  list: ({ status, page = 0, size = 10, sort } = {}) =>
    request('GET', '/events', undefined, { ...(status ? { status } : {}), page, size, ...(sort ? { sort } : {}) }),
  mine: ({ status, page = 0, size = 10, sort } = {}) =>
    request('GET', '/events/mine', undefined, { ...(status ? { status } : {}), page, size, ...(sort ? { sort } : {}) }),
  get: id => request('GET', `/events/${id}`),
  detail: id => request('GET', `/events/${id}`),
  create: data => request('POST', '/events', data),
  update: (id, data) => request('PATCH', `/events/${id}`, data),
  remove: id => request('DELETE', `/events/${id}`),
  sessions: id => request('GET', `/events/${id}/sessions`),
  manageSessions: id => request('GET', `/events/${id}/sessions/manage`),
  createSession: (id, data) => request('POST', `/events/${id}/sessions`, data),
  updateSession: (id, sessionId, data) =>
    request('PATCH', `/events/${id}/sessions/${sessionId}`, data),
  removeSession: (id, sessionId) =>
    request('DELETE', `/events/${id}/sessions/${sessionId}`),
};
