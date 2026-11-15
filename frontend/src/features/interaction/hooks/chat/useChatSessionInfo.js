import { useEffect, useState } from 'react';
import { eventApi } from '../../../event/api/eventApi.js';

// 선택한 투표의 행사 정보, 세션 이름, 관리자 ID 조회
export function useChatSessionInfo(poll) {
  const [chatInfo, setChatInfo] = useState({
    eventName: '',
    sessionName: '',
    adminId: null,
  });

  const eventId = poll?.eventId;
  const sessionId = poll?.sessionId;

  useEffect(() => {
    let active = true;

    setChatInfo({
      eventName: '',
      sessionName: '',
      adminId: null,
    });

    if (eventId == null || sessionId == null) {
      return () => {
        active = false;
      };
    }

    async function loadChatInfo() {
      try {
        // 행사 상세와 세션 목록을 병렬 조회
        const [event, data] = await Promise.all([
          eventApi.get(eventId),
          eventApi.sessions(eventId),
        ]);

        const sessions = Array.isArray(data) ? data : data?.content || [];

        const session = sessions.find((item) => String(item.id) === String(sessionId));

        if (!active) return;

        setChatInfo({
          eventName: event?.title || '',
          sessionName: session?.title || '',
          adminId: event?.createdBy != null ? String(event.createdBy) : null,
        });
      } catch (error) {
        console.error('채팅방 정보 조회 실패:', error);
      }
    }

    void loadChatInfo();

    return () => {
      active = false;
    };
  }, [eventId, sessionId]);

  return chatInfo;
}
