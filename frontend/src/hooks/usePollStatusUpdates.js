// 파일 기능: 세션별 투표 상태 변경 STOMP 알림을 구독합니다.

import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { parseApiResponse } from '../api/requestJson.js';
import axios from 'axios';

// 관리자와 사용자 화면에서 공통으로 사용
export function usePollStatusUpdates({ onStatusChanged }) {
  // 콜백이 변경되어도 WebSocket을 재연결하지 않도록 관리
  const onStatusChangedRef = useRef(onStatusChanged);
  // 변수 역할: 인증 헤더에 사용하는 액세스 토큰
  const accessToken = localStorage.getItem('accessToken');
  // 변수 역할: REST API 서버 주소
  const API_BASE_URL = import.meta.env.VITE_API_URL;
  // 변수 역할: STOMP 연결 주소
  const WS_URL = import.meta.env.VITE_WS_URL;

  useEffect(() => {
    onStatusChangedRef.current = onStatusChanged;
  }, [onStatusChanged]);

  useEffect(() => {
    // 변수 역할: 요청 중단에 사용하는 AbortController
    const controller = new AbortController();

    let client = null;
    let disposed = false;

    // 함수 역할: 구독 가능 세션 조회 후 STOMP 연결을 구성합니다.
    async function connectStatusWebSocket() {
      try {
        const response = await fetch(`${API_BASE_URL}api/interactions/polls/status-subscriptions`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          signal: controller.signal,
        });

        //============================================================================
        // 파서 추가전
        // if (!response.ok) {
        //   throw new Error(`세션 목록 조회 실패: HTTP ${response.status}`);
        // }

        // const sessionIds = await response.json();
        //============================================================================

        // 변수 역할: 상태 알림을 구독할 수 있는 세션 ID 목록
        const sessionIds = await parseApiResponse(response);

        if (!Array.isArray(sessionIds)) {
          throw new Error('잘못된 세션 목록 응답입니다.');
        }

        if (disposed) return;

        console.log('[STOMP STATUS] 구독 대상 세션:', sessionIds);

        // 구독할 세션이 없다면 연결하지 않음
        if (sessionIds.length === 0) return;

        // 2. STOMP 클라이언트 생성
        client = new Client({
          brokerURL: `${WS_URL}/api/ws/interactions`,

          connectHeaders: {
            Authorization: `Bearer ${accessToken}`,
          },

          reconnectDelay: 5000,
          connectionTimeout: 10000,
          heartbeatIncoming: 10000,
          heartbeatOutgoing: 10000,

          // 3. 연결 성공 또는 재연결 성공
          onConnect: () => {
            if (disposed) return;

            console.log('[STOMP STATUS] 연결 성공');

            // 승인받거나 소유한 모든 세션을 구독
            sessionIds.forEach((sessionId) => {
              const topic = `/topic/sessions/${sessionId}/polls/status`;

              client.subscribe(topic, (message) => {
                try {
                  const data = JSON.parse(message.body);

                  if (
                    data.type !== 'POLL_STATUS_CHANGED' ||
                    Number(data.sessionId) !== Number(sessionId)
                  ) {
                    return;
                  }

                  console.log('[STOMP STATUS] 투표 상태 변경 수신:', data);

                  // 관리자 또는 사용자 목록 재조회
                  onStatusChangedRef.current?.();
                } catch (error) {
                  console.error('[STOMP STATUS] 메시지 처리 오류:', error);
                }
              });

              console.log('[STOMP STATUS] 구독 요청:', topic);
            });

            // 최초 연결 및 재연결 후 데이터 동기화
            // 연결이 끊긴 동안 놓친 이벤트 복구
            onStatusChangedRef.current?.();
          },

          onStompError: (frame) => {
            console.error('[STOMP STATUS] STOMP 오류:', frame.headers.message, frame.body);
          },

          onWebSocketError: (error) => {
            console.error('[STOMP STATUS] WebSocket 오류:', error);
          },

          onWebSocketClose: () => {
            console.log('[STOMP STATUS] 연결 종료');
          },
        });

        // 4. 연결 시작
        client.activate();
      } catch (error) {
        if (disposed || controller.signal.aborted) return;

        console.error('[STOMP STATUS] 연결 준비 실패:', error);
      }
    }

    connectStatusWebSocket();

    // 5. 화면 이동 또는 사용자 변경 시 정리
    return () => {
      disposed = true;
      controller.abort();
      client?.deactivate();
    };
  }, []);
}
