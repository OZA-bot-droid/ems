// 행사 화면의 입구 (이도관 담당)
import { useState } from 'react';
import EventList from '../components/EventList.jsx';
import EventDetail from '../components/EventDetail.jsx';
import EventManage from '../components/EventManage.jsx';
import SessionManage from '../components/SessionManage.jsx';
import { useAuth } from '../../member/hooks/useAuth.js';

export default function EventPage() {
  const { role } = useAuth();
  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState('browse'); // 'browse'=둘러보기, 'manage'=행사 관리(관리자)
  const [sessionEventId, setSessionEventId] = useState(null); // 세션 관리 중인 행사 번호

  return (
    <div className="min-h-screen bg-(--ems-bg) font-(family-name:--ems-font) text-(--ems-ink)">
      <div className="mx-auto max-w-[840px] px-6 py-9">
        {/* 관리자에게만 보이는 탭: 둘러보기 / 행사 관리 */}
        {role === 'ADMIN' && (
          <div className="mb-6 flex gap-2 text-[13px] font-semibold">
            {[
              ['browse', '행사 둘러보기'],
              ['manage', '행사 관리'],
            ].map(([v, label]) => (
              <button
                key={v}
                onClick={() => {
                  setView(v);
                  setSelectedId(null);
                  setSessionEventId(null);
                }}
                className={`rounded-[9px] px-4 py-2 ${
                  view === v ? 'bg-(--ems-ink) text-white' : 'bg-(--ems-surface) text-(--ems-ink)'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {shownView === 'manage' ? (
          /* 관리 탭: [세션 관리]를 누른 행사가 있으면 세션 관리, 없으면 행사 관리 */
          sessionEventId ? (
            <SessionManage eventId={sessionEventId} onBack={() => setSessionEventId(null)} />
          ) : (
            <EventManage onManageSessions={setSessionEventId} />
          )
        ) : /* 화면 전환: 선택한 행사가 있으면 상세, 없으면 목록 */
        selectedId ? (
          <EventDetail
            key={`${user.id}-${selectedId}`}
            eventId={selectedId}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <EventList key={user.id ?? 'guest'} onSelect={setSelectedId} />
        )}
      </div>
    </div>
  );
}
