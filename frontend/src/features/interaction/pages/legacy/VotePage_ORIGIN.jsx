// React Hooks: 상태 관리(useState), 변경 감지(useEffect), 함수 참조 유지(useCallback), 렌더링과 무관한 값 보관(useRef).
import { useCallback, useEffect, useRef, useState } from 'react';
// Interaction Service REST API: 투표 목록, 사용자 투표 내역, 투표 제출 및 결과 조회를 담당한다.
import { pollApi } from '../../api/pollApi.js';
// WebSocket/STOMP 연결 유틸리티: 투표·세션 상태 알림을 실시간으로 구독한다.
import { connectPollSocket } from '../../websocket/stompClient.js';

// panel: 투표 목록과 상세 영역에 공통으로 적용하는 Tailwind 카드 스타일.
const panel = 'rounded-xl border border-slate-200 bg-white p-5 shadow-sm';
// action: 투표 제출 버튼의 기본/비활성화 스타일.
const action = 'rounded-lg bg-emerald-700 px-4 py-2 text-white disabled:opacity-40';

// 공통 레이아웃 SCSS 모듈의 클래스명을 실제 CSS 클래스명으로 변환한다.
import { mapClassNames } from '../../../../styles/classNames.js';
import module0 from '../../../components/layout/header.module.scss';
// cx(value): SCSS 모듈에 정의된 클래스명을 조회하는 편의 함수.
const cx = (value) => mapClassNames(value, module0);
import Header from '../../../../components/layout/LegacyHeader.jsx';

/**
 * VotePage: 승인된 사용자의 투표 목록, 참여, 결과 조회 및 실시간 알림을 관리하는 화면.
 * REST API 호출은 pollApi, 실시간 메시지 연결은 connectPollSocket에 위임한다.
 */
export default function VotePage() {
  // polls: 현재 참여 가능한 투표 목록.
  const [polls, setPolls] = useState([]);
  // votes: 로그인 사용자가 이미 제출한 투표 내역(중복 제출 UI 차단에 사용).
  const [votes, setVotes] = useState([]);
  // selectedId: 현재 화면에 선택된 투표 ID.
  const [selectedId, setSelectedId] = useState(null);
  // optionId: 사용자가 라디오 버튼에서 고른 선택지 ID.
  const [optionId, setOptionId] = useState(null);
  // results: 서버에서 조회한 선택지별 득표수와 전체 투표수.
  const [results, setResults] = useState(null);
  // error: REST/WebSocket 처리 중 표시할 오류 메시지.
  const [error, setError] = useState('');
  // notice: 투표 제출 성공 등 사용자 안내 메시지.
  const [notice, setNotice] = useState('');
  // busy: 제출·결과 조회 중 중복 요청을 막기 위한 처리 상태.
  const [busy, setBusy] = useState(false);
  // socketConnected: STOMP 연결 여부를 화면에 표시하고 Topic 구독 시점을 제어한다.
  const [socketConnected, setSocketConnected] = useState(false);
  // socketRef: 렌더링 사이에도 WebSocket 연결 객체를 유지한다.
  const socketRef = useRef(null);
  // unsubscribers: 세션 Topic 구독 해제 함수를 보관해 재연결·언마운트 시 정리한다.
  const unsubscribers = useRef([]);
  // pollIdRef: 현재 선택 투표 ID를 비동기 WebSocket 콜백에서도 최신 값으로 참조한다.
  const pollIdRef = useRef(null);
  // resultsVisible: 사용자가 결과 보기를 요청했는지 저장해 불필요한 결과 재조회를 방지한다.
  const resultsVisible = useRef(false);

  // load(): 참여 가능 투표와 내 투표 내역을 조회하고, 선택 투표가 사라졌다면 첫 투표로 변경한다.
  const load = useCallback(async () => {
    try {
      const list = await pollApi.active();
      setPolls(list);
      // 이전 선택 ID가 목록에 남아 있으면 유지하고, 없으면 첫 항목을 자동 선택한다.
      setSelectedId((id) =>
        list.some((p) => String(p.id) === String(id)) ? id : (list[0]?.id ?? null),
      );
      // 목록에 표시되는 투표 ID로 사용자 투표 내역을 조회한다.
      setVotes(await pollApi.activeVotes(list.map((p) => p.id)));
      setError('');
    } catch (err) {
      setError(err.message || '투표 목록 조회에 실패했습니다.');
    }
  }, []);

  // 선택 투표 변경 시 이전 선택지·결과·알림을 초기화하고 관련 ref를 갱신한다.
  useEffect(() => {
    pollIdRef.current = selectedId;
    resultsVisible.current = false;
    setOptionId(null);
    setResults(null);
    setNotice('');
  }, [selectedId]);

  // refreshResults(id): 현재 선택된 투표의 결과 화면이 열린 경우에만 REST 결과를 갱신한다.
  const refreshResults = useCallback(async (id) => {
    // 다른 투표의 지연된 이벤트나 결과 미노출 상태에서는 서버 조회를 생략한다.
    if (!id || !resultsVisible.current || String(pollIdRef.current) !== String(id)) return;
    try {
      setResults(await pollApi.results(id));
    } catch (err) {
      setError(err.message || '결과 조회에 실패했습니다.');
    }
  }, []);

  // WebSocket 연결/해제 생명주기: 초기 REST 동기화, STOMP 연결, 세션 구독, 10초 보정 조회를 관리한다.
  useEffect(() => {
    // active: 컴포넌트가 언마운트된 이후 비동기 콜백의 상태 변경을 막는다.
    let active = true;
    // connecting: 연결 요청이 동시에 중복 실행되지 않도록 한다.
    let connecting = false;
    // connectionEpoch: 재연결마다 증가시키는 버전 번호로 오래된 세션 조회 응답을 무시한다.
    let connectionEpoch = 0;
    // connect(): 중복 연결을 피한 후 STOMP 클라이언트를 생성하고 이벤트 콜백을 등록한다.
    async function connect() {
      if (!active || connecting || socketRef.current) return;
      connecting = true;
      try {
        // connectPollSocket이 반환한 연결 핸들을 socketRef에 보관한다.
        socketRef.current = connectPollSocket({
          // STOMP 연결 또는 재연결 성공 시 호출되며 subscribe는 Topic 구독 함수다.
          onConnect: async (subscribe) => {
            if (!active) return;
            const epoch = ++connectionEpoch;
            setSocketConnected(true);
            // 재연결할 때 이전 세션 구독을 해제하고 현재 권한 기준으로 다시 구독한다.
            // Auto-resubscribed entries are disposed before rebuilding the current session set.
            unsubscribers.current.forEach((unsubscribe) => unsubscribe());
            unsubscribers.current = [];
            // 연결이 끊긴 동안 누락한 투표 상태 및 (열려 있다면) 결과를 REST로 복구한다.
            load();
            if (resultsVisible.current && pollIdRef.current) refreshResults(pollIdRef.current);
            try {
              // 현재 사용자에게 허용된 세션 ID 목록을 서버에서 조회한다.
              const sessionIds = await pollApi.statusSubscriptions();
              // 이전 연결에서 시작된 비동기 응답이 새 연결의 Topic을 오염시키지 않게 검사한다.
              if (!active || epoch !== connectionEpoch || !socketRef.current?.connected) return;
              for (const sessionId of sessionIds) {
                unsubscribers.current.push(
                  // 세션별 투표 활성화/종료 알림 수신 시 목록을 새로 조회한다.
                  subscribe(`/topic/sessions/${sessionId}/polls/status`, (event) => {
                    if (event.type === 'POLL_STATUS_CHANGED') load();
                  }),
                );
              }
            } catch (err) {
              setError(err.message || '구독 가능한 세션 조회에 실패했습니다.');
            }
          },
          // 연결 종료 시 버전을 증가시켜 진행 중인 구독 준비 작업을 무효화한다.
          onDisconnect: () => {
            connectionEpoch++;
            if (active) setSocketConnected(false);
          },
          // 소켓 오류 시 연결 상태 표시를 해제한다.
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
    // 화면 진입 시 데이터 조회와 WebSocket 연결을 각각 시작한다.
    load();
    connect();
    // WebSocket 메시지 누락·연결 장애에 대비해 10초마다 REST 데이터를 보정 조회한다.
    // REST reconciliation is also used after dropped socket connections.
    // timer: 10,000ms(10초) 간격의 브라우저 setInterval ID.
    const timer = setInterval(() => {
      load();
      if (resultsVisible.current && pollIdRef.current) refreshResults(pollIdRef.current);
    }, 10000);
    // 정리 함수: 주기 조회 중지, Topic 구독 해제, WebSocket 연결 종료.
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

  // 선택된 투표가 있고 연결된 동안에만 해당 투표의 득표 변경 Topic을 구독한다.
  useEffect(() => {
    if (!socketConnected || !selectedId || !socketRef.current) return;
    // unsubscribe: 현재 투표 Topic의 구독 해제 함수로 선택 변경 시 반환되어 실행된다.
    const unsubscribe = socketRef.current.subscribe(
      `/topic/polls/${selectedId}/updates`,
      (event) => {
        // 투표 업데이트 알림 도착 시 실제 집계 결과는 REST API에서 다시 조회한다.
        if (event.type === 'POLL_VOTE_UPDATED') refreshResults(selectedId);
      },
    );
    return unsubscribe;
  }, [socketConnected, selectedId, refreshResults]);

  // poll: 현재 선택된 ID에 해당하는 투표 객체(없으면 undefined).
  const poll = polls.find((p) => String(p.id) === String(selectedId));
  // submitted: 사용자가 이 투표에 이미 제출한 선택지 ID(없으면 undefined).
  const submitted = votes.find((v) => String(v.pollId) === String(poll?.id))?.pollOptionId;
  // canViewResults: 실시간 결과 공개 투표이거나 종료된 투표일 때만 결과 버튼을 허용한다.
  const canViewResults = poll && (poll.showLiveResults || poll.status === 'CLOSED');

  // submit(): 선택지 투표를 서버에 제출한 뒤 내 투표 내역과 성공 메시지를 갱신한다.
  async function submit() {
    // 선택 누락, 중복 제출, 처리 중 재요청을 방지한다(최종 중복 방지는 서버에서 수행).
    if (!poll || !optionId || busy || submitted) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      // REST API로 pollOptionId를 전달해 실제 투표를 생성한다.
      await pollApi.vote(poll.id, { pollOptionId: Number(optionId) });
      // 성공한 투표 내역을 로컬 상태에 반영해 제출 버튼을 즉시 비활성화한다.
      setVotes((current) => [
        ...current.filter((v) => String(v.pollId) !== String(poll.id)),
        { pollId: poll.id, pollOptionId: Number(optionId) },
      ]);
      setNotice('투표가 제출되었습니다.');
      // 결과 화면이 이미 열려 있는 경우에만 최신 결과를 재조회한다.
      await refreshResults(poll.id);
    } catch (err) {
      setError(err.message || '투표 제출에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }
  // showResults(): 서버의 공개 조건을 만족하는 투표 결과를 조회해 결과 영역을 연다.
  async function showResults() {
    if (!poll || !canViewResults || busy) return;
    setBusy(true);
    setError('');
    try {
      // 결과 공개 권한은 화면 조건과 별개로 서버에서도 검증되어야 한다.
      const data = await pollApi.results(poll.id);
      // 성공한 결과 조회를 현재 선택 투표와 연결하여 이후 실시간 갱신을 허용한다.
      pollIdRef.current = poll.id;
      resultsVisible.current = true;
      setResults(data);
    } catch (err) {
      setError(err.message || '투표 결과를 확인할 수 없습니다.');
    } finally {
      setBusy(false);
    }
  }

  // 화면 렌더링: 투표 목록 / 선택지 / 결과 / 연결·오류 상태를 표시한다.
  return (
    <div className={cx('app-shell')}>
      {/* 전체 화면 레이아웃 및 사용자용 공통 헤더. */}
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
        {/* 요청 실패 시 오류 메시지 표시. */}
        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-red-700" role="alert">
            {error}
          </p>
        )}
        {/* 투표 제출 성공 등 상태 안내 메시지 표시. */}
        {notice && (
          <p className="rounded-lg bg-emerald-50 p-3" role="status">
            {notice}
          </p>
        )}
        {/* 왼쪽은 참여 가능한 투표 목록, 오른쪽은 선택한 투표 상세 화면. */}
        <div className="grid gap-4 md:grid-cols-[280px_1fr]">
          <aside className={panel}>
            <h2 className="mb-3 font-semibold">투표 목록 ({polls.length})</h2>
            {/* 투표 목록 버튼: 클릭 시 selectedId를 바꿔 상세 조회 대상을 전환한다. */}
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
                {/* 제출한 투표이거나 요청 처리 중이면 선택지 입력을 비활성화한다. */}
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
                {/* 투표 제출 및 결과 확인: busy/기존 제출/결과 공개 정책으로 버튼을 제어한다. */}
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
                {/* 결과 데이터가 있을 때 선택지별 득표수와 백분율 막대를 표시한다. */}
                {results && (
                  <section className="mt-5 space-y-3">
                    <h3 className="font-bold">투표 결과 ({results.totalVotes ?? 0}표)</h3>
                    {(results.options || []).map((option) => {
                      // count: 현재 선택지가 획득한 표 수(누락 시 0).
                      const count = option.voteCount ?? 0;
                      // percent: 전체 투표수 대비 득표 비율을 정수 퍼센트로 계산한다.
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
