/**
 * 브라우저별 Client ID 생성
 *
 * - HTTPS / localhost: crypto.randomUUID()
 * - HTTP 사설 IP: crypto.getRandomValues() 기반 UUID v4
 */
function generateUUID() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // getRandomValues는 HTTP 환경에서도 사용할 수 있음
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  // UUID version 4
  bytes[6] = (bytes[6] & 0x0f) | 0x40;

  // RFC 4122 variant
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));

  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
}

export const getClientId = () => {
  let clientId = localStorage.getItem('clientId');

  if (!clientId) {
    clientId = generateUUID();
    localStorage.setItem('clientId', clientId);
  }

  return clientId;
};
