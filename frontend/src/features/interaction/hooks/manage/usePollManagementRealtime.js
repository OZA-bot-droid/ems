import { useEffect, useRef, useState } from 'react';
import { connectPollSocket } from '../../websocket/stompClient.js';

/**
 * 관리자 투표 목록의 WebSocket 상태 변경 감지.
 * 현재 관리 목록에 표시된 세션의 상태 변경 Topic을 구독한다.
 */
export function usePollManagementRealtime({ rows, refresh }) {
  // WebSocket 연결 상태
  const [socketConnected, setSocketConnected] = useState(false);

  // 최신 refresh 함수를 보관한다.
  const refreshRef = useRef(refresh);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  // 현재 페이지의 투표 목록에서 중복 없는 세션 ID 추출
  const sessionKey = [...new Set(rows.map((poll) => poll.sessionId).filter((id) => id != null))]
    .map(String)
    .sort()
    .join(',');

  useEffect(() => {
    let active = true;

    // 세션 Topic 구독 해제 함수 목록
    let unsubscribers = [];

    // STOMP 연결 및 재연결
    const socket = connectPollSocket({
      onConnect: (subscribe) => {
        if (!active) return;

        setSocketConnected(true);

        // 이전 연결의 구독 해제
        unsubscribers.forEach((unsubscribe) => unsubscribe());
        unsubscribers = [];

        // 연결이 끊긴 동안 발생한 상태 변경 복구
        void refreshRef.current({ silent: true });

        // 관리 목록에 포함된 세션 Topic 구독
        const sessionIds = sessionKey ? sessionKey.split(',') : [];

        sessionIds.forEach((sessionId) => {
          const unsubscribe = subscribe(`/topic/sessions/${sessionId}/polls/status`, (event) => {
            if (!active) return;

            // 투표 상태 변경 시 관리 목록 재조회
            if (event.type === 'POLL_STATUS_CHANGED') {
              void refreshRef.current({ silent: true });
            }
          });

          unsubscribers.push(unsubscribe);
        });
      },

      onDisconnect: () => {
        if (active) setSocketConnected(false);
      },

      onError: (error) => {
        if (!active) return;

        console.error('투표 관리 WebSocket 오류:', error);
        setSocketConnected(false);
      },
    });

    // WebSocket 메시지 누락을 보완하는 REST 주기 조회
    const timer = setInterval(() => {
      if (active) {
        void refreshRef.current({ silent: true });
      }
    }, 30000);

    // 컴포넌트 종료 또는 구독 세션 변경 시 정리
    return () => {
      active = false;
      clearInterval(timer);

      unsubscribers.forEach((unsubscribe) => unsubscribe());
      unsubscribers = [];

      socket.disconnect();
    };
  }, [sessionKey]);

  return { socketConnected };
}
