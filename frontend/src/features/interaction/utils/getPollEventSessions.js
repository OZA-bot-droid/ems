import { useEffect, useMemo, useState } from 'react';
import { eventApi } from '../../event/api/eventApi.js';

// 현재 조회되는 투표 목록의 행사, 세션 조회
export function getPollEventSessions(rows) {
  const [events, setEvents] = useState([]);
  const [sessions, setSessions] = useState([]);

  // 현재 투표 목록에 포함된 행사 ID 추출
  const eventIdsKey = useMemo(() => {
    return [
      ...new Set(
        rows
          .map((poll) => poll.eventId)
          .filter((id) => id != null)
          .map(String),
      ),
    ]
      .sort()
      .join(',');
  }, [rows]);

  // 행사 목록 조회
  useEffect(() => {
    let active = true;

    async function loadEvents() {
      try {
        const data = await eventApi.mine({
          page: 0,
          size: 100,
        });

        if (active) {
          setEvents(data.content || []);
        }
      } catch (error) {
        console.error('행사 이름 조회 실패:', error);
      }
    }

    void loadEvents();

    return () => {
      active = false;
    };
  }, []);

  // 현재 투표 목록에 포함된 행사의 세션 조회
  useEffect(() => {
    let active = true;

    async function loadSessions() {
      if (!eventIdsKey) {
        setSessions([]);
        return;
      }

      const eventIds = eventIdsKey.split(',');

      const results = await Promise.all(
        eventIds.map(async (eventId) => {
          try {
            const data = await eventApi.manageSessions(eventId);

            const sessionList = Array.isArray(data) ? data : data.content || [];

            return sessionList.map((session) => ({
              ...session,
              eventId,
            }));
          } catch (error) {
            console.error(`행사 ${eventId} 세션 조회 실패:`, error);
            return [];
          }
        }),
      );

      if (active) {
        setSessions(results.flat());
      }
    }

    void loadSessions();

    return () => {
      active = false;
    };
  }, [eventIdsKey]);

  return { events, sessions };
}
