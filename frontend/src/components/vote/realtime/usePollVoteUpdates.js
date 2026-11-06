// 파일 기능: STOMP 투표 업데이트를 수신해 결과 갱신을 알립니다.

import { useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';

// 함수 역할: 현재 투표의 STOMP 메시지를 구독해 결과 재조회 신호를 갱신합니다.
export function usePollVoteUpdates(pollId, userId) {
  // 변수 역할: STOMP 연결 여부
  const [stompConnected, setStompConnected] = useState(false);
  // 변수 역할: 결과 재조회에 사용하는 변경 카운터
  const [refreshKey, setRefreshKey] = useState(0);
  const refreshResults = () => setRefreshKey((value) => value + 1);

  // 변수 역할: WebSocket 접속 기본 주소
  const WS_URL = import.meta.env.VITE_WS_URL;
  // 변수 역할: API에 전달할 로그인 액세스 토큰
  const accessToken = localStorage.getItem('accessToken');

  useEffect(() => {
    if (!pollId) {
      setStompConnected(false);
      return;
    }
    // 변수 역할: 연결 및 구독을 관리하는 STOMP 클라이언트
    const client = new Client({
      brokerURL: `${WS_URL}/api/ws/interactions`,
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },

      reconnectDelay: 5000,
      connectionTimeout: 10000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        console.log('[STOMP] 연결 성공');
        setStompConnected(true);
        // 변수 역할: 현재 투표 업데이트 구독 경로
        const topic = `/topic/polls/${pollId}/updates`;
        client.subscribe(topic, (message) => {
          try {
            const data = JSON.parse(message.body);
            if (data.type === 'POLL_VOTE_UPDATED' && String(data.pollId) === pollId) {
              setRefreshKey((previous) => previous + 1);
            }
          } catch (error) {
            console.error('[STOMP] 투표 메시지 파싱 오류:', error);
          }
        });
        console.log('[STOMP] 구독 요청:', topic);
        setRefreshKey((previous) => previous + 1);
      },
      onStompError: (frame) => {
        console.error('[STOMP] 오류:', frame.headers.message, frame.body);
        setStompConnected(false);
      },
      onWebSocketError: (error) => {
        console.error('[WebSocket] 오류:', error);
        setStompConnected(false);
      },
      onWebSocketClose: () => setStompConnected(false),
    });
    client.activate();
    return () => {
      client.deactivate();
    };
  }, [pollId, userId]);

  return { stompConnected, refreshKey, refreshResults };
}
