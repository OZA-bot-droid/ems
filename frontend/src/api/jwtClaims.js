/** Decode token claims for UI hints only. All authorization is enforced by the backend. */
function claims(token) {
  if (typeof token !== 'string') return {};
  try {
    const base = token.split('.')[1];
    if (!base) return {};
    const encoded = base.replace(/-/g, '+').replace(/_/g, '/');
    const padded = encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=');
    const bytes = Uint8Array.from(atob(padded), c => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch { return {}; }
}
export const getRoleFromAccessToken = token => claims(token).role ?? null;
export const getMemberIdFromAccessToken = token => claims(token).memberId ?? claims(token).sub ?? null;
