import { useEffect, useMemo, useState } from 'react';

const STATUS_LABELS = {
  PENDING: '승인 대기',
  APPROVED: '승인 완료',
  REJECTED: '거절',
  CANCELLED: '취소됨',
};

async function getErrorMessage(response) {
  try {
    const body = await response.json();
    return body.message || body.detail || body.error || `요청에 실패했습니다. (${response.status})`;
  } catch {
    return `요청에 실패했습니다. (${response.status})`;
  }
}

function RegistrationPage() {
  const [registrations, setRegistrations] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRegistrations() {
      setLoading(true);
      setLoadError('');
      try {
        const response = await fetch('/api/events/registrations/me', {
          credentials: 'include',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(await getErrorMessage(response));

        const page = await response.json();
        setRegistrations(Array.isArray(page) ? page : page.content || []);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setLoadError(error.message || '신청 목록을 불러오지 못했습니다.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadRegistrations();
    return () => controller.abort();
  }, []);

  const filteredRegistrations = useMemo(
    () =>
      filter === 'ALL'
        ? registrations
        : registrations.filter((registration) => registration.status === filter),
    [filter, registrations],
  );

  async function cancelRegistration(registration) {
    if (!window.confirm('참가 신청을 취소할까요?')) return;

    setCancellingId(registration.id);
    setActionError('');
    try {
      const response = await fetch(`/api/events/registrations/${registration.id}/cancel`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!response.ok) throw new Error(await getErrorMessage(response));

      const updated = await response.json();
      setRegistrations((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (error) {
      setActionError(error.message || '신청 취소에 실패했습니다.');
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <a className="text-sm text-slate-600 underline" href="/">
        EMS 홈
      </a>
      <h1 className="mt-5 text-3xl font-bold">참가 신청 및 내역</h1>
      <p className="mt-2 text-slate-600">신청 상태를 확인하고 취소할 수 있어요.</p>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">나의 참가 신청</h2>

        <div className="mt-4 flex flex-wrap gap-2" aria-label="신청 상태 필터">
          {[
            ['ALL', '전체'],
            ['PENDING', '승인 대기'],
            ['APPROVED', '승인 완료'],
            ['REJECTED', '거절'],
            ['CANCELLED', '취소됨'],
          ].map(([value, label]) => (
            <button
              className={`rounded-lg border px-3 py-2 text-sm ${filter === value ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white'}`}
              key={value}
              onClick={() => setFilter(value)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        {loading && <p className="mt-6 text-slate-600">신청 내역을 불러오는 중이에요…</p>}
        {!loading && loadError && (
          <div className="mt-6 rounded-lg bg-amber-50 p-4 text-amber-900" role="alert">
            <p>{loadError}</p>
            <p className="mt-1 text-sm">로그인 상태와 이벤트 서비스 연결을 확인해 주세요.</p>
          </div>
        )}
        {actionError && (
          <p className="mt-4 text-red-700" role="alert">
            {actionError}
          </p>
        )}
        {!loading && !loadError && filteredRegistrations.length === 0 && (
          <p className="mt-6 text-slate-600">
            {registrations.length === 0
              ? '아직 참가 신청 내역이 없어요.'
              : '이 상태의 신청 내역이 없어요.'}
          </p>
        )}

        {!loading && !loadError && filteredRegistrations.length > 0 && (
          <ul className="mt-6 divide-y divide-slate-200">
            {filteredRegistrations.map((registration) => {
              const canCancel = ['PENDING', 'APPROVED'].includes(registration.status);
              const eventName = registration.eventTitle || registration.eventName;

              return (
                <li
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  key={registration.id}
                >
                  <div>
                    <strong>{eventName || '행사명 미제공'}</strong>
                    {!eventName && registration.eventId && (
                      <p className="mt-1 break-all text-xs text-slate-500">
                        행사 ID: {registration.eventId}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-slate-600">
                      {STATUS_LABELS[registration.status] || registration.status}
                      {registration.requestedAt &&
                        ` · 신청 ${new Date(registration.requestedAt).toLocaleString('ko-KR')}`}
                    </p>
                  </div>
                  {canCancel && (
                    <button
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50"
                      disabled={cancellingId === registration.id}
                      onClick={() => cancelRegistration(registration)}
                      type="button"
                    >
                      {cancellingId === registration.id ? '취소 중…' : '신청 취소'}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

export default RegistrationPage;
