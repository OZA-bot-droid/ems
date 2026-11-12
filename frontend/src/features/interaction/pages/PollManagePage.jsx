import { useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePollManagement } from '../hooks/manage/usePollManagement.js';
import { usePollCreate } from '../hooks/manage/usePollCreate.js';
import PollManageHeader from '../components/manage/PollManageHeader.jsx';
import PollCreateForm from '../components/manage/PollCreateForm.jsx';
import PollManageTable from '../components/manage/PollManageTable.jsx';
import Header from '../../../components/layout/Header.jsx';
import module0 from '../../../components/layout/header.module.scss';
import { mapClassNames } from '../../../styles/classNames.js';

const cx = (value) => mapClassNames(value, module0);

// 페이지는 URL 필터와 공통 레이아웃·컴포넌트 조립만 담당한다.
export default function PollManagePage() {
  const [params] = useSearchParams();
  const eventFilter = params.get('eventId') || '';
  const sessionFilter = params.get('sessionId') || '';
  const mutationLock = useRef(false);

  const management = usePollManagement(eventFilter, sessionFilter, mutationLock);
  const creation = usePollCreate(eventFilter, sessionFilter, management.refresh, mutationLock);
  const busy = management.busy || creation.busy;
  const error = creation.error || management.error;

  return (
    <div className={cx('app-shell')}>
      <Header role="ADMIN" activePage="votes" />
      <main className="mx-auto max-w-6xl space-y-5 p-5 text-slate-800">
        <PollManageHeader onCreateClick={() => creation.setOpen((v) => !v)} />
        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-red-700" role="alert">
            {error}
          </p>
        )}
        {creation.open && (
          <PollCreateForm
            form={creation.form}
            setForm={creation.setForm}
            update={creation.update}
            events={creation.events}
            sessions={creation.sessions}
            busy={busy}
            onSubmit={creation.create}
          />
        )}
        <PollManageTable
          eventFilter={eventFilter}
          sessionFilter={sessionFilter}
          loading={management.loading}
          rows={management.rows}
          busy={busy}
          page={management.page}
          pages={management.pages}
          onPageChange={management.setPage}
          onChangeStatus={management.change}
        />
        <p className="text-xs text-slate-500">
          서버에서 Event 소유권과 실제 참가 승인 여부를 검증합니다.
        </p>
      </main>
    </div>
  );
}
