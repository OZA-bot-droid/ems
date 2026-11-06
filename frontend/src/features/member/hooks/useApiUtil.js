/** Member migration adapter: ONE common Axios stack, no independent refresh logic.
 * Accepts the legacy useApiUtil(path, {method,body,credentials}) signature.
 * Axios responses expose .data/.status (not Fetch .json()/.ok).
 * Remove this adapter after memberApi.* migration is complete. */
import { useCallback } from 'react';
import { api, publicApi } from '../../../api/axiosInstance';
const PUBLIC_PATHS = ['/members/login','/members/register','/members/oauth2/exchange',
  '/members/password/reset-request','/members/password/reset'];
function endpoint(input) {
  let path = input;
  if (/^https?:\/\//.test(input)) {
    const u = new URL(input);
    if (u.origin !== window.location.origin && !/^http:\/\/localhost:8080$/.test(u.origin))
      throw new Error('외부 출처 API 요청은 허용되지 않습니다.');
    path = u.pathname + u.search;
  }
  path = path.replace(/^\/api(?=\/|$)/, '');
  if (!path.startsWith('/')) path = '/' + path;
  return path;
}
export function useApiUtil() {
  return useCallback((url, options={}) => {
    const dest=endpoint(url);
    const route=dest.split('?')[0];
    const client=PUBLIC_PATHS.includes(route) ? publicApi : api;
    let data=options.data ?? options.body;
    if (typeof data === 'string' && (options.headers?.['Content-type']?.includes('json') ||
        options.headers?.['Content-Type']?.includes('json'))) {
      data=JSON.parse(data);
    }
    return client.request({url: dest, method: options.method||'GET', data});
  }, []);
}
