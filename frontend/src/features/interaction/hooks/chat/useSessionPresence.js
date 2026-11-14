import { useEffect, useRef, useState } from 'react';
import { chatApi } from '../../api/chatApi.js';

// 역할
// 최초 접속 인원 조회
// WebSocket으로 변경된 인원 수신
// 입장·퇴장 안내 이벤트 관리
export function useSessionPresence(sessionId, socketRef, socketConnected) {
  const sessionKey = sessionId == null ? null : String(sessionId);

  const [presence, setPresence] = useState({
    sessionKey: null,
    onlineCount: null,
    notices: [],
  });

  // 가장 최근에 반영한 서버 이벤트 순서
  const latestRevisionRef = useRef(-1);

  // 세션별 입장·퇴장 알림 저장 키
  function getPresenceStorageKey(sessionKey) {
    return `ems-chat-presence-${sessionKey}`;
  }

  // 저장된 알림 조회(sessionStorage 활용)
  function loadStoredNotices(sessionKey) {
    if (sessionKey == null) return [];

    try {
      const stored = sessionStorage.getItem(getPresenceStorageKey(sessionKey));

      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // 알림 저장
  function saveNotices(sessionKey, notices) {
    try {
      sessionStorage.setItem(getPresenceStorageKey(sessionKey), JSON.stringify(notices));
    } catch (error) {
      console.error('채팅 알림 저장 실패:', error);
    }
  }

  useEffect(() => {
    let active = true;

    latestRevisionRef.current = -1;

    setPresence({
      sessionKey,
      onlineCount: null,
      notices: loadStoredNotices(sessionKey),
    });

    if (sessionKey === null || !socketConnected || !socketRef?.current) {
      return () => {
        active = false;
      };
    }

    // 실시간 접속 현황 구독
    const unsubscribe = socketRef.current.subscribe(
      `/topic/sessions/${sessionKey}/presence`,
      (event) => {
        if (!active) return;

        if (String(event.sessionId) !== sessionKey) {
          return;
        }

        const revision = Number(event.revision);

        if (!Number.isFinite(revision) || revision <= latestRevisionRef.current) {
          return;
        }

        latestRevisionRef.current = revision;

        setPresence((previous) => {
          if (previous.sessionKey !== sessionKey) {
            return previous;
          }

          const notice = {
            id: `${sessionKey}-${revision}`,
            type: event.type,
            memberId: event.memberId,
            occurredAt: event.occurredAt,
          };

          const isNotice = event.type === 'JOIN' || event.type === 'LEAVE';

          const updatedNotices = isNotice
            ? [...previous.notices, notice].slice(-30)
            : previous.notices;

          if (isNotice) {
            saveNotices(sessionKey, updatedNotices);
          }

          return {
            ...previous,
            onlineCount: event.onlineCount,
            notices: updatedNotices,
          };
        });
      },
    );

    // 최초 접속 인원 조회
    async function loadPresence() {
      try {
        const data = await chatApi.getPresence(sessionKey);

        if (!active) return;

        const revision = Number(data.revision);

        // WebSocket으로 받은 최신 결과를
        // 늦게 도착한 REST 응답이 덮어쓰지 않도록 한다.
        if (!Number.isFinite(revision) || revision < latestRevisionRef.current) {
          return;
        }

        latestRevisionRef.current = revision;

        setPresence((previous) => {
          if (previous.sessionKey !== sessionKey) {
            return previous;
          }

          return {
            ...previous,
            onlineCount: data.onlineCount,
          };
        });
      } catch (error) {
        if (active) {
          console.error('접속 인원 조회 실패:', error);
        }
      }
    }

    void loadPresence();

    return () => {
      active = false;
      unsubscribe();
    };
  }, [sessionKey, socketRef, socketConnected]);

  const isCurrentSession = presence.sessionKey === sessionKey;

  return {
    onlineCount: isCurrentSession ? presence.onlineCount : null,
    notices: isCurrentSession ? presence.notices : [],
  };
}
