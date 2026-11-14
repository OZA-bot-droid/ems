import { useEffect, useMemo, useState } from 'react';
import { eventApi } from '../../../event/api/eventApi.js';

// 일반 사용자 투표 목록의 행사명·세션명 조회
export function useApprovedPollEventSessionNames(polls) {
  const [namesByEvent, setNamesByEvent] = useState({});

  // 현재 투표 목록에 포함된 행사 ID 중복 제거
  const eventIdsKey = useMemo(
    () =>
      [
        ...new Set(
          polls
            .map((poll) => poll.eventId)
            .filter((id) => id != null)
            .map(String),
        ),
      ]
        .sort()
        .join(','),
    [polls],
  );

  useEffect(() => {
    let active = true;

    async function loadNames() {
      if (!eventIdsKey) {
        setNamesByEvent({});
        return;
      }

      const eventIds = eventIdsKey.split(',');

      const results = await Promise.all(
        eventIds.map(async (eventId) => {
          const [eventResult, sessionsResult] = await Promise.allSettled([
            eventApi.get(eventId),
            eventApi.sessions(eventId),
          ]);

          const event = eventResult.status === 'fulfilled' ? eventResult.value : null;

          const data = sessionsResult.status === 'fulfilled' ? sessionsResult.value : [];

          const sessions = Array.isArray(data) ? data : data?.content || [];

          return [
            eventId,
            {
              eventName: event?.title || '',
              sessions: Object.fromEntries(
                sessions.map((session) => [String(session.id), session.title]),
              ),
            },
          ];
        }),
      );

      if (active) {
        setNamesByEvent(Object.fromEntries(results));
      }
    }

    void loadNames();

    return () => {
      active = false;
    };
  }, [eventIdsKey]);

  return namesByEvent;
}
