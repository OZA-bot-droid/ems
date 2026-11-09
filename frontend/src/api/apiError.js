export class ApiError extends Error {
  constructor({ status = 0, code = 'NETWORK_ERROR', message = '요청을 처리하지 못했습니다.', details = null } = {}) {
    super(message); this.name = 'ApiError'; this.status = status; this.code = code; this.details = details;
  }
}
export function normalizeApiError(error) {
  if (error instanceof ApiError) return error;
  const body = error?.response?.data;
  return new ApiError({ status: error?.response?.status || 0, code: body?.code || (error?.response ? 'UNKNOWN_ERROR' : 'NETWORK_ERROR'), message: body?.message || (error?.response ? '요청을 처리하지 못했습니다.' : '네트워크 연결을 확인해 주세요.'), details: body });
}
export function unwrap(response) {
  if (response.status === 204) return null;
  if (response.data?.success !== true || !Object.hasOwn(response.data, 'data')) {
    throw new ApiError({ status: response.status, code: 'INVALID_API_RESPONSE', message: 'API 성공 응답 규격과 일치하지 않습니다.', details: response.data });
  }
  return response.data.data;
}
