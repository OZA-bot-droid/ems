// USER 행사 찾기 페이지
import { useState } from 'react';
import '../Event/event.scss';
import EventList from '../Event/EventList.jsx';
import EventDetail from '../Event/EventDetail.jsx';
import Header from '../../component/Header.jsx';
import { useAuth } from '../../page/AuthContext.jsx';

export default function EventDiscoveryPage() {
  const { role } = useAuth();
  const [selectedId, setSelectedId] = useState(null);

  return (
    <div className="app-shell">
      <Header role={role} activePage="events" />
      <main className="app-main-content">
        <div className="mx-auto max-w-[840px] px-6 py-9">
          {selectedId ? (
            <EventDetail
              key={selectedId}
              eventId={selectedId}
              onBack={() => setSelectedId(null)}
            />
          ) : (
            <EventList onSelect={setSelectedId} />
          )}
        </div>
      </main>
    </div>
  );
}
