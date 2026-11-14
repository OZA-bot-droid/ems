import React, { useEffect, useState } from 'react';
import { eventApi } from '../../event/api/eventApi.js';
import { registrationApi } from '../../event/api/registrationApi.js';
import { pollApi } from '../../interaction/api/pollApi.js';
import { Link } from 'react-router-dom';

const toRows = (data) => (Array.isArray(data) ? data : (data?.content ?? []));

const eventTabs = (isAdmin) =>
  isAdmin
    ? [
        { id: 'created', label: '생성된 행사' },
        { id: 'closed', label: '마감된 행사' },
      ]
    : [
        { id: 'pending', label: '승인 대기' },
        { id: 'approved', label: '참가 완료' },
        { id: 'ended', label: '종료된 행사' },
      ];

const pollTabs = [
  { id: 'active', label: '진행 중인 투표' },
  { id: 'closed', label: '마감된 투표' },
];

const formatDate = (value) => (value ? new Date(value).toLocaleDateString('ko-KR') : '일정 미정');

const MyActivity = ({ role }) => {
  const isAdmin = role === 'ADMIN';

  const [eventTab, setEventTab] = useState(isAdmin ? 'created' : 'pending');
  const [pollTab, setPollTab] = useState('active');

  const [events, setEvents] = useState([]);
  const [polls, setPolls] = useState([]);

  const [eventLoading, setEventLoading] = useState(true);
  const [pollLoading, setPollLoading] = useState(true);
  const [eventError, setEventError] = useState('');
  const [pollError, setPollError] = useState('');

  useEffect(() => {
    let cancelled = false;

    setEventTab(isAdmin ? 'created' : 'pending');
    setPollTab('active');

    const load = async () => {
      setEventLoading(true);
      setPollLoading(true);
      setEventError('');
      setPollError('');
      setEvents([]);
      setPolls([]);

      // Event Service
      const loadEvents = async () => {
        try {
          if (isAdmin) {
            const response = await eventApi.mine({
              page: 0,
              size: 100,
            });

            if (!cancelled) setEvents(toRows(response));
          } else {
            const [registrationData, eventData] = await Promise.all([
              registrationApi.mine({ page: 0, size: 100 }),
              eventApi.list({ page: 0, size: 100 }),
            ]);

            const eventMap = new Map(toRows(eventData).map((event) => [event.id, event]));

            const rows = toRows(registrationData).map((item) => ({
              ...item,
              event: eventMap.get(item.eventId),
            }));

            if (!cancelled) setEvents(rows);
          }
        } catch (error) {
          if (!cancelled) {
            setEventError(error.message || '행사 정보를 불러오지 못했습니다.');
          }
        } finally {
          if (!cancelled) setEventLoading(false);
        }
      };

      // Interaction Service
      const loadPolls = async () => {
        try {
          const response = isAdmin
            ? await pollApi.mine({ page: 0, size: 100 })
            : await pollApi.userPolls({ page: 0, size: 100 });

          if (!cancelled) setPolls(toRows(response));
        } catch (error) {
          if (!cancelled) {
            setPollError(error.message || '투표 정보를 불러오지 못했습니다.');
          }
        } finally {
          if (!cancelled) setPollLoading(false);
        }
      };

      await Promise.all([loadEvents(), loadPolls()]);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const now = Date.now();

  const filteredEvents = events.filter((item) => {
    if (isAdmin) {
      if (eventTab === 'created') {
        return ['DRAFT', 'OPEN'].includes(item.status);
      }
      return item.status === 'CLOSED';
    }

    if (eventTab === 'pending') {
      return item.status === 'PENDING';
    }

    if (item.status !== 'APPROVED') return false;

    const endsAt = item.event?.endsAt;
    const hasEnded = endsAt ? new Date(endsAt).getTime() < now : false;

    return eventTab === 'ended' ? hasEnded : !hasEnded;
  });

  const filteredPolls = polls.filter((item) =>
    pollTab === 'active' ? item.status === 'ACTIVE' : item.status === 'CLOSED',
  );

  const userClosedPollsUnavailable = !isAdmin && pollTab === 'closed';

  return (
    <div className="mt-6 grid gap-5 xl:grid-cols-2">
      {/* 나의 행사 */}
      <section className="min-w-0 overflow-hidden rounded-2xl border border-ems-member-input-border bg-ems-surface shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-2xl">
              📅
            </div>
            <div>
              <h3 className="text-lg font-bold text-ems-text">나의 행사</h3>
              <p className="mt-1 text-xs text-ems-muted">
                {isAdmin ? '내가 생성하고 운영하는 행사' : '참가 신청 및 승인된 행사'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 p-4">
          {eventTabs(isAdmin).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setEventTab(tab.id)}
              aria-pressed={eventTab === tab.id}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                eventTab === tab.id
                  ? 'bg-ems-primary text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-[220px] px-5 pb-5">
          {eventLoading ? (
            <p className="py-12 text-center text-sm text-slate-500">행사 목록을 불러오는 중...</p>
          ) : eventError ? (
            <p role="alert" className="py-12 text-center text-sm text-red-600">
              {eventError}
            </p>
          ) : filteredEvents.length === 0 ? (
            <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl bg-slate-50">
              <span className="text-3xl">📭</span>
              <p className="mt-3 text-sm text-slate-500">해당하는 행사가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">조회된 항목 {filteredEvents.length}개</p>

              {filteredEvents.slice(0, 4).map((item) => {
                const event = isAdmin ? item : item.event;

                return (
                  <Link
                    key={item.id}
                    to={isAdmin ? '/admin/events' : '/registrations'}
                    className="block rounded-xl border border-slate-100 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/40"
                  >
                    <p className="font-semibold text-slate-800">
                      {event?.title || `행사 #${item.eventId ?? item.id}`}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {formatDate(event?.startsAt)}
                      {' ~ '}
                      {formatDate(event?.endsAt)}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 p-4 text-right">
          <Link
            to={isAdmin ? '/admin/events' : '/registrations'}
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            전체 행사 보기 →
          </Link>
        </div>
      </section>

      {/* 나의 참여 활동 */}
      <section className="min-w-0 overflow-hidden rounded-2xl border border-ems-member-input-border bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-2xl">
              📊
            </div>
            <div>
              <h3 className="text-lg font-bold text-ems-text">나의 참여 활동</h3>
              <p className="mt-1 text-xs text-ems-muted">
                {isAdmin ? '내가 생성한 투표의 진행 현황' : '참가 가능한 투표와 활동 현황'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 p-4">
          {pollTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPollTab(tab.id)}
              aria-pressed={pollTab === tab.id}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                pollTab === tab.id
                  ? 'bg-ems-primary text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-[220px] px-5 pb-5">
          {pollLoading ? (
            <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl bg-slate-50 px-4 text-center">
              <span className="text-3xl">🗳️</span>
              <p className="mt-3 text-sm font-semibold text-slate-700">마감된 투표</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                사용자 마감 투표 목록 API 연동이 필요합니다.
              </p>
            </div>
          ) : pollLoading ? (
            <p className="py-12 text-center text-sm text-slate-500">투표 목록을 불러오는 중...</p>
          ) : pollError ? (
            <p role="alert" className="py-12 text-center text-sm text-red-600">
              {pollError}
            </p>
          ) : filteredPolls.length === 0 ? (
            <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl bg-slate-50">
              <span className="text-3xl">📭</span>
              <p className="mt-3 text-sm text-slate-500">해당하는 투표가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">조회된 항목 {filteredPolls.length}개</p>

              {filteredPolls.slice(0, 4).map((poll) => (
                <Link
                  key={poll.id}
                  to={isAdmin ? '/admin/polls' : '/polls/vote'}
                  className="block rounded-xl border border-slate-100 p-4 transition hover:border-blue-300 hover:bg-blue-50/40"
                >
                  <p className="font-semibold text-slate-800">{poll.title}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {formatDate(poll.startsAt)}
                    {' ~ '}
                    {formatDate(poll.endsAt)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 p-4 text-right">
          <Link
            to={isAdmin ? '/admin/polls' : '/polls/user'}
            className="text-xs font-semibold text-blue-700 hover:underline"
          >
            전체 투표 보기 →
          </Link>
        </div>
      </section>
    </div>
  );
};

export default MyActivity;
