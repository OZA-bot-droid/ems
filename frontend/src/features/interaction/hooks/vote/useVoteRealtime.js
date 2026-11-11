// 기존 VotePage의 WebSocket 연결, 구독 및 주기적 REST 보정 조회를 이동했다.
import { useEffect, useRef, useState } from 'react';
import { pollApi } from '../../api/pollApi.js';
// WebSocket/STOMP 연결 유틸리티: 투표·세션 상태 알림을 실시간으로 구독한다.
import { connectPollSocket } from '../../websocket/stompClient.js';

/** STOMP 재연결, 세션별 상태 구독, 선택 투표 결과 갱신을 관리한다. */
export function useVoteRealtime({
  selectedId,
  load,
  refreshResults,
  pollIdRef,
  resultsVisible,
  setError,
}) {
  // socketConnected: STOMP 연결 여부를 화면에 표시하고 Topic 구독 시점을 제어한다.
  const [socketConnected, setSocketConnected] = useState(false);
  // socketRef: 렌더링 사이에도 WebSocket 연결 객체를 유지한다.
  const socketRef = useRef(null);
  // unsubscribers: 세션 Topic 구독 해제 함수를 보관해 재연결·언마운트 시 정리한다.
  const unsubscribers = useRef([]);
  // WebSocket 연결/해제 생명주기: 초기 REST 동기화, STOMP 연결, 세션 구독, 10초 보정 조회를 관리한다.
  useEffect(() => {
    // active: 컴포넌트가 언마운트된 이후 비동기 콜백의 상태 변경을 막는다.
    let active = true;
    // connecting: 연결 요청이 동시에 중복 실행되지 않도록 한다.
    let connecting = false;
    // connectionEpoch: 재연결마다 증가시키는 버전 번호로 오래된 세션 조회 응답을 무시한다.
    let connectionEpoch = 0;
    // connect(): 중복 연결을 피한 후 STOMP 클라이언트를 생성하고 이벤트 콜백을 등록한다.
    async function connect() {
      if (!active || connecting || socketRef.current) return;
      connecting = true;
      try {
        // connectPollSocket이 반환한 연결 핸들을 socketRef에 보관한다.
        socketRef.current = connectPollSocket({
          // STOMP 연결 또는 재연결 성공 시 호출되며 subscribe는 Topic 구독 함수다.
          onConnect: async (subscribe) => {
            if (!active) return;
            const epoch = ++connectionEpoch;
            setSocketConnected(true);
            // 재연결할 때 이전 세션 구독을 해제하고 현재 권한 기준으로 다시 구독한다.
            // Auto-resubscribed entries are disposed before rebuilding the current session set.
            unsubscribers.current.forEach((unsubscribe) => unsubscribe());
            unsubscribers.current = [];
            // 연결이 끊긴 동안 누락한 투표 상태 및 (열려 있다면) 결과를 REST로 복구한다.
            load();
            if (resultsVisible.current && pollIdRef.current) refreshResults(pollIdRef.current);
            try {
              // 현재 사용자에게 허용된 세션 ID 목록을 서버에서 조회한다.
              const sessionIds = await pollApi.statusSubscriptions();
              // 이전 연결에서 시작된 비동기 응답이 새 연결의 Topic을 오염시키지 않게 검사한다.
              if (!active || epoch !== connectionEpoch || !socketRef.current?.connected) return;
              for (const sessionId of sessionIds) {
                unsubscribers.current.push(
                  // 세션별 투표 활성화/종료 알림 수신 시 목록을 새로 조회한다.
                  subscribe(`/topic/sessions/${sessionId}/polls/status`, (event) => {
                    if (event.type === 'POLL_STATUS_CHANGED') load();
                  }),
                );
              }
            } catch (err) {
              setError(err.message || '구독 가능한 세션 조회에 실패했습니다.');
            }
          },
          // 연결 종료 시 버전을 증가시켜 진행 중인 구독 준비 작업을 무효화한다.
          onDisconnect: () => {
            connectionEpoch++;
            if (active) setSocketConnected(false);
          },
          // 소켓 오류 시 연결 상태 표시를 해제한다.
          onError: () => {
            if (active) setSocketConnected(false);
          },
        });
      } catch {
        setSocketConnected(false);
      } finally {
        connecting = false;
      }
    }
    // 화면 진입 시 데이터 조회와 WebSocket 연결을 각각 시작한다.
    load();
    connect();
    // WebSocket 메시지 누락·연결 장애에 대비해 10초마다 REST 데이터를 보정 조회한다.
    // REST reconciliation is also used after dropped socket connections.
    // timer: 10,000ms(10초) 간격의 브라우저 setInterval ID.
    const timer = setInterval(() => {
      load();
      if (resultsVisible.current && pollIdRef.current) refreshResults(pollIdRef.current);
    }, 10000);
    // 정리 함수: 주기 조회 중지, Topic 구독 해제, WebSocket 연결 종료.
    return () => {
      active = false;
      connectionEpoch++;
      clearInterval(timer);
      unsubscribers.current.forEach((unsubscribe) => unsubscribe());
      unsubscribers.current = [];
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [load, refreshResults]);

  // 선택된 투표가 있고 연결된 동안에만 해당 투표의 득표 변경 Topic을 구독한다.
  useEffect(() => {
    if (!socketConnected || !selectedId || !socketRef.current) return;
    // unsubscribe: 현재 투표 Topic의 구독 해제 함수로 선택 변경 시 반환되어 실행된다.
    const unsubscribe = socketRef.current.subscribe(
      `/topic/polls/${selectedId}/updates`,
      (event) => {
        // 투표 업데이트 알림 도착 시 실제 집계 결과는 REST API에서 다시 조회한다.
        if (event.type === 'POLL_VOTE_UPDATED') refreshResults(selectedId);
      },
    );
    return unsubscribe;
  }, [socketConnected, selectedId, refreshResults]);

  return { socketConnected };
}
