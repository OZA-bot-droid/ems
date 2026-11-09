// Access token is memory-only; Refresh Token belongs to the HttpOnly cookie.
let accessToken = null;
const listeners = new Set();
export const tokenStore = {
  get: () => accessToken,
  set(token) { accessToken = token || null; listeners.forEach((fn) => fn(accessToken)); },
  clear() { this.set(null); },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
};
