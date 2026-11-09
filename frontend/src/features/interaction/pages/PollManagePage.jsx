import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { pollApi } from '../api/pollApi.js';
import { eventApi } from '../../event/api/eventApi.js';
import module0 from '../../../components/layout/header.module.scss';
import { mapClassNames } from '../../../styles/classNames.js';
const cx = (value) => mapClassNames(value, module0);
import Header from '../../../components/layout/LegacyHeader.jsx';

const panel = 'rounded-xl border border-slate-200 bg-white p-5 shadow-sm';
const field = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm';
const btn =
  'rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';
export default function PollManagePage() {
  const [params] = useSearchParams();
  const eventFilter = params.get('eventId') || '';
  const sessionFilter = params.get('sessionId') || '';
  const [page, setPage] = useState(0),
    [rows, setRows] = useState([]),
    [pages, setPages] = useState(0),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  const [events, setEvents] = useState([]),
    [sessions, setSessions] = useState([]),
    [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    eventId: eventFilter,
    sessionId: sessionFilter,
    title: '',
    startsAt: '',
    endsAt: '',
    showLiveResults: true,
    options: ['', ''],
  });
  const update = (key, value) => setForm((s) => ({ ...s, [key]: value }));
  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await pollApi.mine({
        page,
        size: 20,
        ...(eventFilter ? { eventId: eventFilter } : {}),
        ...(sessionFilter ? { sessionId: sessionFilter } : {}),
      });
      setRows(data.content || []);
      setPages(data.totalPages || 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, eventFilter, sessionFilter]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  useEffect(() => {
    setPage(0);
    setForm((s) => ({ ...s, eventId: eventFilter, sessionId: sessionFilter }));
  }, [eventFilter, sessionFilter]);
  useEffect(() => {
    let ok = true;
    eventApi
      .mine({ page: 0, size: 100 })
      .then((d) => {
        if (ok) setEvents(d.content || []);
      })
      .catch((e) => {
        if (ok) setError(e.message);
      });
    return () => {
      ok = false;
    };
  }, []);
  useEffect(() => {
    if (!form.eventId) {
      setSessions([]);
      return;
    }
    let ok = true;
    eventApi
      .manageSessions(form.eventId)
      .then((s) => {
        if (ok) setSessions(s);
      })
      .catch((e) => {
        if (ok) setError(e.message);
      });
    return () => {
      ok = false;
    };
  }, [form.eventId]);
  async function create(e) {
    e.preventDefault();
    if (busy) return;
    const session = sessions.find((s) => String(s.id) === String(form.sessionId));
    const start = new Date(form.startsAt),
      end = new Date(form.endsAt);
    if (!session) {
      setError('유효한 행사 및 세션을 선택하세요.');
      return;
    }
    if (
      !(
        start > new Date() &&
        end > start &&
        start >= new Date(session.startsAt) &&
        end <= new Date(session.endsAt)
      )
    ) {
      setError('투표 일정은 미래의 세션 운영 시간 안에 있어야 합니다.');
      return;
    }
    if (form.options.some((o) => !o.trim()) || form.options.length < 2) {
      setError('선택지 두 개 이상을 입력하세요.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await pollApi.create({
        title: form.title.trim(),
        eventId: Number(form.eventId),
        sessionId: Number(form.sessionId),
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        showLiveResults: form.showLiveResults,
        options: form.options.map((content) => ({ content: content.trim() })),
      });
      setOpen(false);
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function change(id, action) {
    setBusy(true);
    setError('');
    try {
      await pollApi[action](id);
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={cx('app-shell')}>
      <Header role="ADMIN" activePage="votes" />

      <main className="mx-auto max-w-6xl space-y-5 p-5 text-slate-800">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-emerald-700">SYNC5 / Interaction</p>
            <h1 className="text-2xl font-bold">투표 관리</h1>
            <p className="text-sm text-slate-500">행사 세션별 투표를 생성하고 활성화·종료합니다.</p>
          </div>
          <div className="flex gap-2">
            <Link className={btn} to="/admin/sessions">
              세션 관리
            </Link>
            <button className={btn} onClick={() => setOpen((v) => !v)}>
              ＋ 새 투표
            </button>
          </div>
        </header>
        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-red-700" role="alert">
            {error}
          </p>
        )}
        {open && (
          <form className={panel + ' space-y-3'} onSubmit={create}>
            <h2 className="font-bold">투표 생성</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <label>
                행사
                <select
                  required
                  className={field}
                  value={form.eventId}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, eventId: e.target.value, sessionId: '' }))
                  }
                >
                  <option value="">행사 선택</option>
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                세션
                <select
                  required
                  className={field}
                  value={form.sessionId}
                  onChange={(e) => update('sessionId', e.target.value)}
                >
                  <option value="">세션 선택</option>
                  {sessions.map((s) => (
                    <option value={s.id} key={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block">
              질문
              <input
                required
                maxLength={255}
                className={field}
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
              />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label>
                시작
                <input
                  className={field}
                  required
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => update('startsAt', e.target.value)}
                />
              </label>
              <label>
                종료
                <input
                  className={field}
                  required
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => update('endsAt', e.target.value)}
                />
              </label>
            </div>
            <h3 className="font-semibold">선택지</h3>
            {form.options.map((o, i) => (
              <div key={i} className="flex gap-2">
                <input
                  required
                  maxLength={255}
                  className={field}
                  value={o}
                  onChange={(e) =>
                    update(
                      'options',
                      form.options.map((s, j) => (j === i ? e.target.value : s)),
                    )
                  }
                />
                <button
                  type="button"
                  disabled={form.options.length <= 2}
                  onClick={() =>
                    update(
                      'options',
                      form.options.filter((_, j) => i !== j),
                    )
                  }
                >
                  삭제
                </button>
              </div>
            ))}
            <button type="button" onClick={() => update('options', [...form.options, ''])}>
              ＋ 선택지
            </button>
            <label className="flex gap-2">
              <input
                type="checkbox"
                checked={form.showLiveResults}
                onChange={(e) => update('showLiveResults', e.target.checked)}
              />
              실시간 결과 공개
            </label>
            <button disabled={busy} type="submit" className={btn}>
              투표 생성
            </button>
          </form>
        )}
        <section className={panel}>
          <h2 className="mb-4 font-bold">
            등록된 투표 {eventFilter && '(행사 ' + eventFilter + ')'}{' '}
            {sessionFilter && '(세션 ' + sessionFilter + ')'}
          </h2>
          {loading ? (
            <p>불러오는 중...</p>
          ) : rows.length === 0 ? (
            <p>표시할 투표가 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    {['투표', '행사 / 세션', '시작', '상태', '관리'].map((x) => (
                      <th key={x} className="border-b p-3">
                        {x}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="p-3 font-semibold">{p.title}</td>
                      <td className="p-3">
                        {p.eventId} / {p.sessionId}
                      </td>
                      <td className="p-3">{new Date(p.startsAt).toLocaleString('ko-KR')}</td>
                      <td className="p-3">{p.status}</td>
                      <td className="space-x-2 p-3">
                        <button
                          className={btn}
                          disabled={busy || !p.canActivate}
                          onClick={() => change(p.id, 'activate')}
                        >
                          활성화
                        </button>
                        <button
                          disabled={busy || !p.canClose}
                          onClick={() => change(p.id, 'close')}
                        >
                          종료
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {pages > 1 && (
            <div className="mt-4 flex gap-3">
              <button disabled={page === 0} onClick={() => setPage((v) => v - 1)}>
                이전
              </button>
              <span>
                {page + 1}/{pages}
              </span>
              <button disabled={page + 1 >= pages} onClick={() => setPage((v) => v + 1)}>
                다음
              </button>
            </div>
          )}
        </section>
        <p className="text-xs text-slate-500">
          서버에서 Event 소유권과 실제 참가 승인 여부를 검증합니다.
        </p>
      </main>
    </div>
  );
}
