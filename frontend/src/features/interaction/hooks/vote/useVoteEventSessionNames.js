import { useEffect, useState } from 'react';
import { eventApi } from '../../../event/api/eventApi.js';

// 선택한 투표의 행사명과 세션명 조회
export function useVoteEventSessionNames(poll) {
  const [eventName, setEventName] = useState('');
  const [sessionName, setSessionName] = useState('');

  const eventId = poll?.eventId;
  const sessionId = poll?.sessionId;

  useEffect(() => {
    let active = true;

    // 이전 투표의 이름이 남아 있지 않도록 초기화
    setEventName('');
    setSessionName('');

    if (eventId == null || sessionId == null) {
      return () => {
        active = false;
      };
    }

    async function loadNames() {
      // 행사 상세 조회
      try {
        const event = await eventApi.get(eventId);

        if (active) {
          setEventName(event.title || '');
        }
      } catch (error) {
        console.error('행사 이름 조회 실패:', error);
      }

      // 세션 목록 조회
      try {
        const data = await eventApi.sessions(eventId);

        const sessions = Array.isArray(data) ? data : data?.content || [];

        const session = sessions.find((s) => String(s.id) === String(sessionId));

        if (active) {
          setSessionName(session?.title || '');
        }
      } catch (error) {
        console.error('세션 이름 조회 실패:', error);
      }
    }

    void loadNames();

    return () => {
      active = false;
    };
  }, [eventId, sessionId]);

  return { eventName, sessionName };
}
