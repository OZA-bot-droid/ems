import { useCallback, useEffect, useRef, useState } from 'react';
import { pollApi } from '../../api/pollApi.js';
import { connectPollSocket } from '../../websocket/stompClient.js';

const panel = 'rounded-xl border border-slate-200 bg-white p-5 shadow-sm';
const action = 'rounded-lg bg-emerald-700 px-4 py-2 text-white disabled:opacity-40';

import { mapClassNames } from '../../../../styles/classNames.js';
import module0 from '../../../components/layout/header.module.scss';
const cx = (value) => mapClassNames(value, module0);
import Header from '../../../../components/layout/LegacyHeader.jsx';

export default function VotePage() {
  const [polls, setPolls] = useState([]);
  const [votes, setVotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [optionId, setOptionId] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef(null);
  const unsubscribers = useRef([]);
  const pollIdRef = useRef(null);
  const resultsVisible = useRef(false);

  const load = useCallback(async () => {
    try {
      const list = await pollApi.active();
      setPolls(list);
      setSelectedId((id) =>
        list.some((p) => String(p.id) === String(id)) ? id : (list[0]?.id ?? null),
      );
      setVotes(await pollApi.activeVotes(list.map((p) => p.id)));
      setError('');
    } catch (err) {
      setError(err.message || '투표 목록 조회에 실패했습니다.');
    }
  }, []);

  useEffect(() => {
    pollIdRef.current = selectedId;
    resultsVisible.current = false;
    setOptionId(null);
    setResults(null);
    setNotice('');
  }, [selectedId]);

  const refreshResults = useCallback(async (id) => {
    if (!id || !resultsVisible.current || String(pollIdRef.current) !== String(id)) return;
    try {
      setResults(await pollApi.results(id));
    } catch (err) {
      setError(err.message || '결과 조회에 실패했습니다.');
    }
  }, []);

  useEffect(() => {
    let active = true;
    let connecting = false;
    let connectionEpoch = 0;
    async function connect() {
      if (!active || connecting || socketRef.current) return;
      connecting = true;
      try {
        socketRef.current = connectPollSocket({
          onConnect: async (subscribe) => {
            if (!active) return;
            const epoch = ++connectionEpoch;
            setSocketConnected(true);
            // Auto-resubscribed entries are disposed before rebuilding the current session set.
            unsubscribers.current.forEach((unsubscribe) => unsubscribe());
            unsubscribers.current = [];
            load();
            if (resultsVisible.current && pollIdRef.current) refreshResults(pollIdRef.current);
            try {
              const sessionIds = await pollApi.statusSubscriptions();
              if (!active || epoch !== connectionEpoch || !socketRef.current?.connected) return;
              for (const sessionId of sessionIds) {
                unsubscribers.current.push(
                  subscribe(`/topic/sessions/${sessionId}/polls/status`, (event) => {
                    if (event.type === 'POLL_STATUS_CHANGED') load();
                  }),
                );
              }
            } catch (err) {
              setError(err.message || '구독 가능한 세션 조회에 실패했습니다.');
            }
          },
          onDisconnect: () => {
            connectionEpoch++;
            if (active) setSocketConnected(false);
          },
          onError: () => {
            if (active) setSocketConnected(false);
          },
        });
      } catch {
        setSocketConnected(false);
      } finally {
        connecting = false;
      }
    }
    load();
    connect();
    // REST reconciliation is also used after dropped socket connections.
    const timer = setInterval(() => {
      load();
      if (resultsVisible.current && pollIdRef.current) refreshResults(pollIdRef.current);
    }, 10000);
    return () => {
      active = false;
      connectionEpoch++;
      clearInterval(timer);
      unsubscribers.current.forEach((unsubscribe) => unsubscribe());
      unsubscribers.current = [];
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [load, refreshResults]);

  useEffect(() => {
    if (!socketConnected || !selectedId || !socketRef.current) return;
    const unsubscribe = socketRef.current.subscribe(
      `/topic/polls/${selectedId}/updates`,
      (event) => {
        if (event.type === 'POLL_VOTE_UPDATED') refreshResults(selectedId);
      },
    );
    return unsubscribe;
  }, [socketConnected, selectedId, refreshResults]);

  const poll = polls.find((p) => String(p.id) === String(selectedId));
  const submitted = votes.find((v) => String(v.pollId) === String(poll?.id))?.pollOptionId;
  const canViewResults = poll && (poll.showLiveResults || poll.status === 'CLOSED');

  async function submit() {
    if (!poll || !optionId || busy || submitted) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await pollApi.vote(poll.id, { pollOptionId: Number(optionId) });
      setVotes((current) => [
        ...current.filter((v) => String(v.pollId) !== String(poll.id)),
        { pollId: poll.id, pollOptionId: Number(optionId) },
      ]);
      setNotice('투표가 제출되었습니다.');
      await refreshResults(poll.id);
    } catch (err) {
      setError(err.message || '투표 제출에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }
  async function showResults() {
    if (!poll || !canViewResults || busy) return;
    setBusy(true);
    setError('');
    try {
      const data = await pollApi.results(poll.id);
      pollIdRef.current = poll.id;
      resultsVisible.current = true;
      setResults(data);
    } catch (err) {
      setError(err.message || '투표 결과를 확인할 수 없습니다.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cx('app-shell')}>
      <Header role="USER" activePage="votes" />
      <main className="mx-auto max-w-6xl space-y-5 p-5">
        <header>
          <p className="text-sm text-emerald-700">SYNC5 / Interaction</p>
          <h1 className="text-2xl font-bold">실시간 투표</h1>
          <p className="text-sm text-slate-500">
            승인된 행사 참가자에게 공개된 투표입니다.{' '}
            {socketConnected ? '실시간 연결됨' : '주기적으로 업데이트 중'}
          </p>
        </header>
        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-red-700" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="rounded-lg bg-emerald-50 p-3" role="status">
            {notice}
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-[280px_1fr]">
          <aside className={panel}>
            <h2 className="mb-3 font-semibold">투표 목록 ({polls.length})</h2>
            {polls.map((p) => (
              <button
                key={p.id}
                aria-pressed={String(p.id) === String(selectedId)}
                className={
                  'mb-2 w-full rounded-lg border p-3 text-left ' +
                  (String(p.id) === String(selectedId)
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200')
                }
                onClick={() => setSelectedId(p.id)}
              >
                <strong>{p.title}</strong>
                <p className="text-xs text-slate-500">
                  행사 {p.eventId} / 세션 {p.sessionId}
                </p>
              </button>
            ))}
            {polls.length === 0 && <p>참여 가능한 투표가 없습니다.</p>}
          </aside>
          <section className={panel}>
            {!poll && <p>왼쪽에서 투표를 선택하세요.</p>}
            {poll && (
              <>
                <h2 className="text-xl font-bold">{poll.title}</h2>
                <p className="mb-4 text-sm text-slate-500">
                  {poll.status} · {new Date(poll.endsAt).toLocaleString('ko-KR')} 종료
                </p>
                <fieldset disabled={!!submitted || busy} className="space-y-2">
                  {(poll.options || []).map((option) => (
                    <label key={option.id} className="flex gap-3 rounded-lg border p-3">
                      <input
                        name="poll-option"
                        type="radio"
                        checked={String(optionId || submitted) === String(option.id)}
                        onChange={() => setOptionId(option.id)}
                      />
                      {option.content}
                    </label>
                  ))}
                </fieldset>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    className={action}
                    disabled={busy || !!submitted || !optionId}
                    onClick={submit}
                  >
                    {submitted ? '투표 완료' : '투표 제출'}
                  </button>
                  <button
                    className="rounded-lg border px-4 py-2 disabled:opacity-40"
                    onClick={showResults}
                    disabled={busy || !canViewResults}
                  >
                    결과 확인
                  </button>
                </div>
                {!canViewResults && (
                  <p className="mt-3 text-sm text-slate-500">
                    투표 종료 후 결과를 확인할 수 있습니다.
                  </p>
                )}
                {results && (
                  <section className="mt-5 space-y-3">
                    <h3 className="font-bold">투표 결과 ({results.totalVotes ?? 0}표)</h3>
                    {(results.options || []).map((option) => {
                      const count = option.voteCount ?? 0;
                      const percent =
                        results.totalVotes > 0 ? Math.round((count * 100) / results.totalVotes) : 0;
                      return (
                        <div key={option.pollOptionId}>
                          <div className="flex justify-between text-sm">
                            <span>{option.content}</span>
                            <span>
                              {count}표 · {percent}%
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-emerald-600"
                              style={{ width: percent + '%' }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </section>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
