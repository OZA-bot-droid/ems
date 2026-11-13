import { useCallback, useEffect, useRef, useState } from 'react';
import { chatApi } from '../../api/chatApi.js';

/**
 * 채팅 메시지를 ID 기준으로 중복 제거하고 정렬한다.
 *
 * REST 조회와 WebSocket 수신이 동시에 발생해도
 * 동일한 메시지가 두 번 표시되지 않도록 처리한다.
 */
function mergeMessages(current, incoming) {
  const messageMap = new Map();

  for (const message of [...current, ...incoming]) {
    if (message?.id == null) continue;

    messageMap.set(String(message.id), message);
  }

  return [...messageMap.values()].sort((a, b) => {
    const timeDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

    return timeDiff || Number(a.id) - Number(b.id);
  });
}

/**
 * 세션별 채팅 상태를 관리한다.
 *
 * sessionId: 현재 선택한 세션 ID
 * socketRef: useVoteRealtime에서 생성한 STOMP 연결
 * socketConnected: STOMP 연결 상태
 */
export function useSessionChat(sessionId, socketRef, socketConnected) {
  // 현재 채팅방 식별자
  const sessionKey = sessionId == null ? null : String(sessionId);

  // 세션별 채팅 상태
  const [chatState, setChatState] = useState({
    sessionKey: null,
    messages: [],
    loading: false,
    error: '',
  });

  // 이전 WebSocket 연결 상태 저장
  const previousConnectedRef = useRef(socketConnected);

  /**
   * 1. 세션별 이전 채팅 기록 REST 조회
   */
  useEffect(() => {
    let active = true;

    // 세션 변경 시 기존 채팅 내용 초기화
    setChatState({
      sessionKey,
      messages: [],
      loading: sessionKey !== null,
      error: '',
    });

    // 선택된 세션이 없으면 조회하지 않음
    if (sessionKey === null) {
      return () => {
        active = false;
      };
    }

    async function loadMessages() {
      try {
        // 해당 세션의 최근 채팅 기록 조회
        const response = await chatApi.getMessages(sessionKey);

        if (!active) return;

        const history = Array.isArray(response) ? response : [];

        // REST 조회 중 실시간으로 받은 메시지는 보존한다.
        setChatState((previous) => {
          if (previous.sessionKey !== sessionKey) {
            return previous;
          }

          return {
            ...previous,
            messages: mergeMessages(previous.messages, history),
            loading: false,
          };
        });
      } catch (err) {
        if (!active) return;

        setChatState((previous) => {
          if (previous.sessionKey !== sessionKey) {
            return previous;
          }

          return {
            ...previous,
            loading: false,
            error: err?.message || '채팅 기록 조회에 실패했습니다.',
          };
        });
      }
    }

    void loadMessages();

    return () => {
      active = false;
    };
  }, [sessionKey]);

  /**
   * 2. 현재 세션의 실시간 채팅 Topic 구독
   */
  useEffect(() => {
    // 세션이 선택되지 않았으면 구독하지 않음
    if (sessionKey === null) return;

    // STOMP 연결이 없으면 구독하지 않음
    if (!socketConnected || !socketRef?.current) return;

    // 현재 세션 채팅 Topic
    const destination = `/topic/sessions/${sessionKey}/chat`;

    // 기존 투표 WebSocket의 subscribe() 재사용
    const unsubscribe = socketRef.current.subscribe(destination, (message) => {
      // 잘못된 메시지 무시
      if (!message || message.id == null) return;

      // 다른 세션의 메시지라면 무시
      if (String(message.sessionId) !== sessionKey) {
        return;
      }

      // 새 채팅 메시지를 기존 목록에 추가
      setChatState((previous) => {
        if (previous.sessionKey !== sessionKey) {
          return previous;
        }

        return {
          ...previous,
          messages: mergeMessages(previous.messages, [message]),
        };
      });
    });

    // 세션 변경 또는 연결 종료 시 구독 해제
    return () => {
      unsubscribe();
    };
  }, [sessionKey, socketRef, socketConnected]);

  /**
   * 3. WebSocket 재연결 시 누락된 채팅 복구
   */
  useEffect(() => {
    const wasConnected = previousConnectedRef.current;

    // 현재 연결 상태 기록
    previousConnectedRef.current = socketConnected;

    // 연결이 끊겼다가 다시 연결된 경우만 복구
    if (wasConnected || !socketConnected || sessionKey === null) {
      return;
    }

    let active = true;

    async function recoverMessages() {
      try {
        const response = await chatApi.getMessages(sessionKey);

        if (!active) return;

        const history = Array.isArray(response) ? response : [];

        setChatState((previous) => {
          if (previous.sessionKey !== sessionKey) {
            return previous;
          }

          return {
            ...previous,
            messages: mergeMessages(previous.messages, history),
          };
        });
      } catch (err) {
        if (active) {
          console.error('채팅 기록 복구 실패:', err);
        }
      }
    }

    void recoverMessages();

    return () => {
      active = false;
    };
  }, [sessionKey, socketConnected]);

  /**
   * 4. 채팅 메시지 전송
   *
   * 기존 투표 WebSocket 연결을 재사용한다.
   * 메시지 저장과 브로드캐스트는 백엔드 ChatService에서 처리한다.
   */
  const sendMessage = useCallback(
    (content) => {
      // 선택된 세션이 없는 경우 전송 차단
      if (sessionKey === null) {
        throw new Error('채팅할 세션이 선택되지 않았습니다.');
      }

      // STOMP 연결 여부 확인
      if (!socketConnected || !socketRef?.current?.connected) {
        throw new Error('실시간 채팅 서버에 연결되지 않았습니다.');
      }

      // 입력값 검증
      if (typeof content !== 'string') {
        throw new Error('올바르지 않은 채팅 메시지입니다.');
      }

      // 앞뒤 공백 제거
      const message = content.trim();

      // 빈 메시지 전송 방지
      if (!message) {
        throw new Error('메시지를 입력해 주세요.');
      }

      // 최대 1000자 제한
      if (message.length > 1000) {
        throw new Error('메시지는 1000자 이하로 입력해 주세요.');
      }

      // STOMP 전송 목적지
      const destination = `/app/sessions/${sessionKey}/chat.send`;

      // 기존 stompClient.js의 publish() 호출
      socketRef.current.publish(destination, {
        content: message,
      });
    },
    [sessionKey, socketRef, socketConnected],
  );

  /**
   * 5. 외부 컴포넌트에 상태 반환
   *
   * 렌더링 시 세션이 바뀌었더라도
   * 이전 세션의 채팅이 노출되지 않도록 한다.
   */

  const isCurrentSession = chatState.sessionKey === sessionKey;

  return {
    // 현재 세션의 채팅 메시지 목록
    messages: isCurrentSession ? chatState.messages : [],

    // 채팅 기록 조회 상태
    loading: isCurrentSession ? chatState.loading : sessionKey !== null,

    // 오류 메시지
    error: isCurrentSession ? chatState.error : '',

    // STOMP 채팅 메시지 전송 함수
    sendMessage,
  };
}
