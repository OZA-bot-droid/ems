import { tokenStore } from '../../../api/tokenStore.js';
import { refreshAccessToken } from '../../../api/axiosInstance.js';

/**
 * Authenticated STOMP 1.2 client over the Gateway WebSocket path.
 * Reconnects with backoff and replays subscriptions using fresh Access JWTs.
 * Call disconnect() on component unmount to stop all timers and reconnection.
 */
export function connectPollSocket({
  onConnect,
  onDisconnect,
  onError,
  reconnectInitialMs = 1000,
  reconnectMaxMs = 30000,
} = {}) {
  const subscriptions = new Map();
  let socket = null;
  let connected = false;
  let disposed = false;
  let generation = 0;
  let sequence = 0;
  let retries = 0;
  let retryTimer = null;
  let heartbeatTimer = null;
  let watchdogTimer = null;
  let lastRead = Date.now();
  let activeToken = null;
  let buffer = '';

  function clearHeartbeat() {
    clearInterval(heartbeatTimer);
    clearInterval(watchdogTimer);
    heartbeatTimer = null;
    watchdogTimer = null;
  }
  function send(command, headers = {}, body = '') {
    if (socket?.readyState !== WebSocket.OPEN) return;
    const lines = [command, ...Object.entries(headers).map(([name, value]) => `${name}:${value}`)];
    socket.send(lines.join('\n') + '\n\n' + body + '\0');
  }
  function register(entry) {
    if (connected) send('SUBSCRIBE', { id: entry.id, destination: entry.destination, ack: 'auto' });
  }
  function subscribe(destination, callback) {
    const id = 'sub-' + ++sequence;
    const entry = { id, destination, callback };
    subscriptions.set(id, entry);
    register(entry);
    return () => {
      if (connected) send('UNSUBSCRIBE', { id });
      subscriptions.delete(id);
    };
  }

  function report(error) {
    if (!disposed) onError?.(error instanceof Error ? error : new Error(String(error)));
  }
  function retry() {
    if (disposed || retryTimer) return;
    const base = Math.min(reconnectMaxMs, reconnectInitialMs * 2 ** Math.min(retries++, 10));
    const delay = Math.round(base * (0.8 + Math.random() * 0.4));
    retryTimer = setTimeout(() => { retryTimer = null; void open(); }, delay);
  }
  function closeSocket() {
    clearHeartbeat();
    if (socket) {
      const previous = socket;
      socket = null;
      previous.onopen = null;
      previous.onmessage = null;
      previous.onerror = null;
      previous.onclose = null;
      if (previous.readyState === WebSocket.OPEN || previous.readyState === WebSocket.CONNECTING) previous.close();
    }
  }
  function disconnectCurrent(error) {
    if (error) report(error);
    const wasConnected = connected;
    connected = false;
    closeSocket();
    if (wasConnected && !disposed) onDisconnect?.();
    retry();
  }
  async function getValidToken() {
    const token = tokenStore.get();
    if (!token) return refreshAccessToken();
    // Only inspect expiry for proactive refresh; the server verifies the JWT signature.
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now() + 30000) {
        return await refreshAccessToken();
      }
    } catch {
      return await refreshAccessToken();
    }
    return token;
  }
  function startHeartbeat(headers) {
    clearHeartbeat();
    const [serverCanSend, serverWantsReceive] = String(headers['heart-beat'] || '0,0')
      .split(',').map(Number);
    const outbound = serverWantsReceive > 0 ? Math.max(10000, serverWantsReceive) : 0;
    const inbound = serverCanSend > 0 ? Math.max(10000, serverCanSend) : 0;
    if (outbound) heartbeatTimer = setInterval(() => {
      if (socket?.readyState === WebSocket.OPEN) socket.send('\n');
    }, outbound);
    if (inbound) watchdogTimer = setInterval(() => {
      if (Date.now() - lastRead > inbound * 2.5) {
        disconnectCurrent(new Error('WebSocket heartbeat timeout'));
      }
    }, inbound);
  }
  function handleFrame(raw) {
    const divider = raw.indexOf('\n\n');
    if (divider < 0) return;
    const lines = raw.slice(0, divider).split('\n');
    const command = lines.shift()?.trim();
    const headers = Object.fromEntries(lines.filter(Boolean).map(line => {
      const i = line.indexOf(':');
      return i < 0 ? [line, ''] : [line.slice(0, i), line.slice(i + 1)];
    }));
    if (command === 'CONNECTED') {
      retries = 0;
      connected = true;
      lastRead = Date.now();
      startHeartbeat(headers);
      for (const entry of subscriptions.values()) register(entry);
      onConnect?.(subscribe);
    } else if (command === 'MESSAGE') {
      const entry = subscriptions.get(headers.subscription);
      if (!entry) return;
      try { entry.callback(JSON.parse(raw.slice(divider + 2))); }
      catch (error) { report(error); }
    } else if (command === 'ERROR') {
      disconnectCurrent(new Error(raw.slice(divider + 2) || 'STOMP 서버 오류'));
    }
  }

  async function open() {
    if (disposed || socket || retryTimer) return;
    const attempt = ++generation;
    let token;
    try { token = await getValidToken(); }
    catch (error) { report(error); if (tokenStore.get()) retry(); return; }
    if (disposed || socket || attempt !== generation) return;
    if (!token) return;
    activeToken = token;
    const url = new URL('/api/ws/interactions', window.location.href);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    buffer = '';
    let ws;
    try { ws = new WebSocket(url); }
    catch (error) { report(error); retry(); return; }
    socket = ws;
    ws.onopen = () => {
      if (disposed || ws !== socket) return;
      send('CONNECT', {
        'accept-version': '1.2',
        'heart-beat': '10000,10000',
        Authorization: 'Bearer ' + activeToken,
      });
    };
    ws.onmessage = event => {
      if (ws !== socket || typeof event.data !== 'string') return;
      lastRead = Date.now();
      buffer += event.data.replace(/\r\n/g, '\n');
      let end;
      while ((end = buffer.indexOf('\0')) !== -1) {
        const raw = buffer.slice(0, end).replace(/^\n+/, '');
        buffer = buffer.slice(end + 1);
        if (raw) handleFrame(raw);
        if (ws !== socket) break;
      }
      if (buffer.length > 1_000_000) disconnectCurrent(new Error('STOMP frame is too large'));
    };
    ws.onerror = () => report(new Error('WebSocket 연결 오류'));
    ws.onclose = () => {
      if (ws !== socket) return;
      disconnectCurrent();
    };
  }

  // Close and reconnect with the latest token when the identity changes.
  const unsubscribeToken = tokenStore.subscribe(next => {
    if (disposed) return;
    if (!next) {
      // Logout must not trigger another refresh-cookie request.
      disposed = true;
      generation++;
      clearTimeout(retryTimer);
      retryTimer = null;
      closeSocket();
      return;
    }
    if (!socket || next === activeToken) return;
    disconnectCurrent();
  });
  void open();
  return {
    subscribe,
    get connected() { return connected; },
    disconnect() {
      disposed = true;
      generation++;
      clearTimeout(retryTimer);
      retryTimer = null;
      unsubscribeToken();
      if (connected) send('DISCONNECT');
      connected = false;
      closeSocket();
      subscriptions.clear();
    },
  };
}
