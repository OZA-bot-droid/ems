// Access Token의 현재 값과 변경 알림을 제공하는 프론트 공통 저장소를 가져온다.
import { tokenStore } from '../../../api/tokenStore.js';

// Access Token이 없거나 만료되기 직전이면 공통 인증 계층을 통해 재발급한다.
import { refreshAccessToken } from '../../../api/axiosInstance.js';

/**
 * Authenticated STOMP 1.2 client over the Gateway WebSocket path.
 * Reconnects with backoff and replays subscriptions using fresh Access JWTs.
 * Call disconnect() on component unmount to stop all timers and reconnection.
 */

// 투표 결과를 수신하기 위한 WebSocket/STOMP 연결 함수
// onConnect: 연결 성공 시 실행
// onDisconnect: 연결 종료 시 실행
// onError: 오류 발생 시 실행
// reconnectInitialMs: 최초 재접속 대기 시간 (기본 1초)
// reconnectMaxMs: 최대 재접속 기본 대기 시간 (기본 30초)
export function connectPollSocket({
  onConnect,
  onDisconnect,
  onError,
  reconnectInitialMs = 1000,
  reconnectMaxMs = 30000,
} = {}) {
  // 구독 ID → {id, destination, callback} 매핑.
  // 재접속 시 기존 구독을 복원하는 데 사용한다.
  const subscriptions = new Map();

  // 현재 브라우저 WebSocket 인스턴스.
  // 연결 전/종료 후에는 null이다.
  let socket = null;

  // WebSocket OPEN이 아니라 STOMP CONNECTED 프레임까지
  // 받은 상태인지 나타낸다.
  let connected = false;

  // true이면 이 클라이언트 인스턴스를 폐기한 것이므로
  // 신규 연결·재시도를 중단한다.
  let disposed = false;

  // 비동기 토큰 조회 중 오래된 연결 시도가
  // 뒤늦게 실행되지 않도록 구분하는 번호다.
  let generation = 0;

  // 각 SUBSCRIBE 요청에 사용할 구독 ID의 증가 카운터다.
  let sequence = 0;

  // 연속 재접속 횟수.
  // 재접속 대기시간의 지수 증가에 사용하고 성공하면 초기화한다.
  let retries = 0;

  // 예약된 재접속 setTimeout의 ID.
  // 중복 예약 및 종료 시 취소에 사용한다.
  let retryTimer = null;

  // 서버로 STOMP heartbeat 개행문자를
  // 주기적으로 전송하는 타이머 ID다.
  let heartbeatTimer = null;

  // 서버의 heartbeat/메시지 수신이 끊겼는지
  // 감시하는 타이머 ID다.
  let watchdogTimer = null;

  // 서버에서 마지막으로 문자열 메시지를 수신한 시각(ms)이다.
  let lastRead = Date.now();

  // 현재 WebSocket의 STOMP CONNECT 프레임에
  // 사용한 Access Token이다.
  let activeToken = null;

  // WebSocket 메시지에 나뉘어 도착하거나
  // 이어 붙은 STOMP 프레임을 조립하는 버퍼다.
  let buffer = '';

  // heartbeat 전송/수신 감시 타이머를 모두 정리한다.
  function clearHeartbeat() {
    clearInterval(heartbeatTimer);
    clearInterval(watchdogTimer);
    heartbeatTimer = null;
    watchdogTimer = null;
  }

  // STOMP 명령·헤더·본문을 프레임으로 직렬화해
  // 열린 WebSocket으로 전송한다.
  // 프레임 형식: COMMAND + 헤더 + 빈 줄 + BODY + 널 종료 문자(\0).
  function send(command, headers = {}, body = '') {
    if (socket?.readyState !== WebSocket.OPEN) return;

    // 헤더 객체를 '이름:값' 형식의 STOMP 헤더 줄로 변환한다.
    const lines = [command, ...Object.entries(headers).map(([name, value]) => `${name}:${value}`)];

    socket.send(lines.join('\n') + '\n\n' + body + '\0');
  }

  // STOMP 연결이 확립된 경우 서버에 SUBSCRIBE 프레임을 보내
  // 구독을 등록한다.
  // ack:auto는 메시지마다 클라이언트 ACK를
  // 별도로 보내지 않는 모드다.
  function register(entry) {
    if (connected) send('SUBSCRIBE', { id: entry.id, destination: entry.destination, ack: 'auto' });
  }

  // 주어진 STOMP destination을 구독 목록에 추가하고
  // 해제 함수를 반환한다.
  // 예: /topic/sessions/{sessionId}/polls/{pollId}
  // 실제 접근 권한은 서버가 검증해야 한다.
  function subscribe(destination, callback) {
    // 동일 destination을 여러 곳에서 구독하더라도
    // 고유한 구독 ID를 할당한다.
    const id = 'sub-' + ++sequence;

    const entry = { id, destination, callback };

    subscriptions.set(id, entry);
    register(entry);

    // 화면 언마운트 등으로 더 이상 필요하지 않을 때
    // 호출할 구독 해제 함수다.
    return () => {
      if (connected) send('UNSUBSCRIBE', { id });
      subscriptions.delete(id);
    };
  }

  // 서버에 STOMP SEND 프레임을 전송한다.
  // 채팅 메시지 전송에 사용한다.
  // destination 예: /app/sessions/3/chat.send
  function publish(destination, payload) {
    // 연결이 종료되었거나 STOMP 연결이 확립되지 않은 경우 차단
    if (disposed || !connected || socket?.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket이 연결되지 않았습니다.');
    }

    // 전송 목적지 검증
    if (typeof destination !== 'string' || !destination.startsWith('/app/')) {
      throw new Error('올바르지 않은 STOMP 전송 경로입니다.');
    }

    // 기존 send() 함수를 재사용하여 STOMP SEND 프레임 전송
    send(
      'SEND',
      {
        destination,
        'content-type': 'application/json',
      },
      JSON.stringify(payload),
    );
  }

  // 오류를 Error 객체로 정규화해 외부 onError 콜백에 전달한다.
  // 폐기 후에는 전달하지 않는다.
  function report(error) {
    if (!disposed) onError?.(error instanceof Error ? error : new Error(String(error)));
  }

  // 재접속을 지수 백오프(1초→2초→4초... 기반)와
  // ±20% 지터로 예약한다.
  // disposed 상태이거나 예약이 이미 있으면 중복 재접속하지 않는다.
  function retry() {
    if (disposed || retryTimer) return;

    // 연속 실패에 따라 기본 대기시간을 늘리되
    // reconnectMaxMs를 넘지 않는다.
    const base = Math.min(reconnectMaxMs, reconnectInitialMs * 2 ** Math.min(retries++, 10));

    // 동시 접속한 여러 클라이언트의 재접속 시점이
    // 몰리지 않게 무작위 편차를 준다.
    const delay = Math.round(base * (0.8 + Math.random() * 0.4));

    retryTimer = setTimeout(() => {
      retryTimer = null;
      void open();
    }, delay);
  }

  // heartbeat를 중단하고 현재 소켓의 이벤트 핸들러를
  // 제거한 후 물리 연결을 닫는다.
  // 이전 소켓의 onclose로 인해 중복 재시도가 발생하지 않도록
  // 핸들러를 먼저 해제한다.
  function closeSocket() {
    clearHeartbeat();

    if (socket) {
      const previous = socket;
      socket = null;

      previous.onopen = null;
      previous.onmessage = null;
      previous.onerror = null;
      previous.onclose = null;

      if (previous.readyState === WebSocket.OPEN || previous.readyState === WebSocket.CONNECTING)
        previous.close();
    }
  }

  // 현재 연결을 끊고 필요 시 오류/연결 해제 콜백을
  // 알린 후 재접속을 예약한다.
  function disconnectCurrent(error) {
    if (error) report(error);

    const wasConnected = connected;
    connected = false;

    closeSocket();

    if (wasConnected && !disposed) onDisconnect?.();

    retry();
  }

  // STOMP CONNECT에 사용할 최신 Access Token을 가져온다.
  // 토큰이 없거나 만료가 30초 이내면 공통 재발급 함수에 요청한다.
  async function getValidToken() {
    // 로그인 상태의 Access Token을 공통 저장소에서 조회한다.
    const token = tokenStore.get();

    if (!token) return refreshAccessToken();

    // Only inspect expiry for proactive refresh;
    // the server verifies the JWT signature.
    try {
      // JWT payload를 클라이언트에서 디코딩해 exp만 검사한다.
      // 서명 검증은 서버 책임이다.
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));

      if (typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now() + 30000) {
        return await refreshAccessToken();
      }
    } catch {
      return await refreshAccessToken();
    }

    return token;
  }

  // STOMP CONNECTED 헤더의 heart-beat 값을 읽어
  // 송신/수신 감시를 설정한다.
  function startHeartbeat(headers) {
    clearHeartbeat();

    // 서버의 송신 가능 주기와 서버가 원하는
    // 수신 주기(ms)를 분리한다.
    const [serverCanSend, serverWantsReceive] = String(headers['heart-beat'] || '0,0')
      .split(',')
      .map(Number);

    // 서버가 heartbeat 수신을 요구하면 클라이언트의
    // 송신 간격을 정한다(최소 10초).
    const outbound = serverWantsReceive > 0 ? Math.max(10000, serverWantsReceive) : 0;

    // 서버가 heartbeat 송신을 지원하면
    // 서버 수신 감시 간격을 정한다(최소 10초).
    const inbound = serverCanSend > 0 ? Math.max(10000, serverCanSend) : 0;

    // 연결이 열려 있으면 개행문자 하나를 전송해
    // 연결 생존 신호를 보낸다.
    if (outbound)
      heartbeatTimer = setInterval(() => {
        if (socket?.readyState === WebSocket.OPEN) socket.send('\n');
      }, outbound);

    // 마지막 수신 후 예상 간격의 2.5배를 초과하면
    // 연결 이상으로 판단한다.
    if (inbound)
      watchdogTimer = setInterval(() => {
        if (Date.now() - lastRead > inbound * 2.5) {
          disconnectCurrent(new Error('WebSocket heartbeat timeout'));
        }
      }, inbound);
  }

  // 조립된 STOMP 프레임을 명령·헤더·본문으로
  // 분해하고 종류별로 처리한다.
  function handleFrame(raw) {
    // 헤더와 본문은 첫 번째 빈 줄(\n\n)로 구분된다.
    const divider = raw.indexOf('\n\n');
    if (divider < 0) return;

    const lines = raw.slice(0, divider).split('\n');
    const command = lines.shift()?.trim();

    // 각 헤더 줄에서 첫 콜론을 기준으로 이름과 값을 분리한다.
    const headers = Object.fromEntries(
      lines.filter(Boolean).map((line) => {
        const i = line.indexOf(':');
        return i < 0 ? [line, ''] : [line.slice(0, i), line.slice(i + 1)];
      }),
    );

    // 연결 수립: 재시도 횟수 초기화 → heartbeat 시작
    // → 기존 구독 복원 → 콜백 호출.
    if (command === 'CONNECTED') {
      retries = 0;
      connected = true;
      lastRead = Date.now();

      startHeartbeat(headers);

      for (const entry of subscriptions.values()) register(entry);

      onConnect?.(subscribe);

      // 구독 ID로 콜백을 찾고 JSON 본문을 파싱해
      // 투표 결과 등 수신 데이터를 전달한다.
    } else if (command === 'MESSAGE') {
      const entry = subscriptions.get(headers.subscription);
      if (!entry) return;

      try {
        entry.callback(JSON.parse(raw.slice(divider + 2)));
      } catch (error) {
        report(error);
      }

      // 서버가 STOMP ERROR 프레임을 보낸 경우
      // 현재 연결을 종료하고 재접속을 시도한다.
    } else if (command === 'ERROR') {
      disconnectCurrent(new Error(raw.slice(divider + 2) || 'STOMP 서버 오류'));
    }
  }

  // 토큰을 준비하고 Gateway 경로에 WebSocket을 열어
  // STOMP CONNECT를 수행한다.
  // 중복 연결·폐기된 인스턴스·대기 중인 재접속 상태에서는
  // 실행하지 않는다.
  async function open() {
    if (disposed || socket || retryTimer) return;

    // 이 연결 시도의 세대 번호를 기억해
    // 토큰 조회 후 무효화된 요청인지 판단한다.
    const attempt = ++generation;
    let token;

    // 토큰 재발급은 비동기다.
    // 실패하면 오류를 전달하고 조건에 따라 다시 시도한다.
    try {
      token = await getValidToken();
    } catch (error) {
      report(error);
      if (tokenStore.get()) retry();
      return;
    }

    if (disposed || socket || attempt !== generation) return;
    if (!token) return;

    // 이번 연결의 STOMP 인증에 사용할 토큰을 기록한다.
    activeToken = token;

    // 현재 웹 페이지의 호스트 기준 상대 경로를 사용한다.
    // Vite/Nginx/Gateway가 프록시하도록 설계됨.
    // WebSocket 경로는 일반 REST의 StripPrefix 경로와
    // 다를 수 있으므로 프록시 설정 확인이 필요하다.
    const url = new URL('/api/ws/interactions', window.location.href);

    // 웹 페이지가 HTTPS면 wss, HTTP면 ws 프로토콜을 사용한다.
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';

    buffer = '';
    let ws;

    try {
      ws = new WebSocket(url);
    } catch (error) {
      report(error);
      retry();
      return;
    }

    socket = ws;

    // 물리 WebSocket이 열리면 STOMP 1.2 CONNECT 프레임에
    // Access JWT를 첨부한다.
    // 브라우저의 WebSocket 생성자에 임의 HTTP Authorization
    // 헤더를 넣는 방식이 아니다.
    ws.onopen = () => {
      if (disposed || ws !== socket) return;

      send('CONNECT', {
        'accept-version': '1.2',
        'heart-beat': '10000,10000',
        Authorization: 'Bearer ' + activeToken,
      });
    };

    // 서버의 WebSocket 텍스트 데이터를 누적한 뒤
    // 널 종료 문자 단위로 STOMP 프레임을 처리한다.
    ws.onmessage = (event) => {
      if (ws !== socket || typeof event.data !== 'string') return;

      lastRead = Date.now();

      // 줄바꿈을 정규화하고 분할 전송된 프레임의
      // 남은 부분에 이어 붙인다.
      buffer += event.data.replace(/\r\n/g, '\n');

      let end;

      // 하나의 WebSocket 메시지에 여러 STOMP 프레임이
      // 들어와도 모두 처리한다.
      while ((end = buffer.indexOf('\0')) !== -1) {
        const raw = buffer.slice(0, end).replace(/^\n+/, '');
        buffer = buffer.slice(end + 1);

        if (raw) handleFrame(raw);

        if (ws !== socket) break;
      }

      // 프레임 종료 문자가 오지 않아 버퍼가
      // 과도하게 커지는 상황을 차단한다(1MB).
      if (buffer.length > 1_000_000) disconnectCurrent(new Error('STOMP frame is too large'));
    };

    // WebSocket 전송 오류를 외부 콜백에 통지한다.
    // 종료·재접속은 onclose에서 처리한다.
    ws.onerror = () => report(new Error('WebSocket 연결 오류'));

    // 현재 소켓이 실제로 닫혔을 때만
    // 연결 상태를 정리하고 재접속을 예약한다.
    ws.onclose = () => {
      if (ws !== socket) return;
      disconnectCurrent();
    };
  }

  // Close and reconnect with the latest token when the identity changes.

  // 로그인 토큰 변경을 감시한다.
  // 토큰이 갱신되면 새 토큰으로 STOMP 재인증하도록 재연결한다.
  const unsubscribeToken = tokenStore.subscribe((next) => {
    if (disposed) return;

    // 로그아웃 등으로 토큰이 제거되면
    // 자동 재발급 없이 연결과 타이머를 중단한다.
    if (!next) {
      // Logout must not trigger another refresh-cookie request.
      disposed = true;
      generation++;

      clearTimeout(retryTimer);
      retryTimer = null;

      closeSocket();
      return;
    }

    // 토큰이 동일하거나 현재 소켓이 없으면
    // 불필요한 재접속을 하지 않는다.
    if (!socket || next === activeToken) return;

    disconnectCurrent();
  });

  // 클라이언트 생성과 동시에 첫 연결을 시작한다.
  // Promise는 내부에서 처리한다.
  void open();

  // 외부 React 컴포넌트/Hook에 노출할
  // 최소 인터페이스만 반환한다.
  return {
    // STOMP destination 구독을 등록하고 해제 함수를 받는다.
    subscribe,

    // STOMP 메시지를 서버에 전송한다.
    publish,

    // 현재 STOMP 연결 상태를 조회하는 읽기 전용 getter다.
    get connected() {
      return connected;
    },

    // 컴포넌트 언마운트 시 호출:
    // 재접속 금지, 타이머/이벤트/구독 정리, DISCONNECT 전송.
    disconnect() {
      disposed = true;
      generation++;

      clearTimeout(retryTimer);
      retryTimer = null;

      // 토큰 변경 감시 구독을 해제하여
      // 폐기한 클라이언트에 이벤트가 남지 않도록 한다.
      unsubscribeToken();

      // 정상 STOMP 연결 중이면 프로토콜 종료 명령을 서버에 전송한다.
      if (connected) send('DISCONNECT');

      connected = false;
      closeSocket();

      // 저장된 구독 정보를 모두 제거해 메모리를 정리한다.
      subscriptions.clear();
    },
  };
}
