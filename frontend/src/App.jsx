import { useEffect, useMemo, useState } from 'react';

const KEY = 'ems-demo-polls-v1';
const USER = 'demo-user-101'; // 데모 전용. 실제 서비스는 서버가 JWT에서 식별해야 합니다.
const now = Date.now();
const initial = [
  {
    id: 1,
    eventId: 101,
    eventName: '2026 테크 커넥트 컨퍼런스',
    title: '가장 기대되는 세션 주제는?',
    description: '오늘 행사에서 가장 관심 있는 주제를 하나 선택해 주세요.',
    startDate: new Date(now - 3600000).toISOString(),
    endDate: new Date(now + 86400000).toISOString(),
    options: [
      { id: 11, content: 'AI 에이전트와 자동화' },
      { id: 12, content: '클라우드 네이티브' },
      { id: 13, content: '데이터 분석 및 활용' },
      { id: 14, content: '개발자 생산성' },
    ],
    votes: [
      { userId: 'seed-1', optionId: 11 },
      { userId: 'seed-2', optionId: 11 },
      { userId: 'seed-3', optionId: 12 },
      { userId: 'seed-4', optionId: 13 },
      { userId: 'seed-5', optionId: 14 },
    ],
  },
];
const events = [
  { id: 101, name: '2026 테크 커넥트 컨퍼런스' },
  { id: 102, name: '개발자 네트워킹 데이' },
];
const fmt = (value) =>
  new Date(value).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' });
const localValue = (date) => {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
};
const statusOf = (poll, time) =>
  time < new Date(poll.startDate).getTime()
    ? '예정'
    : time >= new Date(poll.endDate).getTime()
      ? '종료'
      : '진행 중';
const load = () => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : initial;
  } catch {
    return initial;
  }
};

export default function App() {
  const [polls, setPolls] = useState(load);
  const [tab, setTab] = useState('vote');
  const [selectedPoll, setSelectedPoll] = useState(1);
  const [optionId, setOptionId] = useState(null);
  const [time, setTime] = useState(Date.now());
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    eventId: '101',
    title: '',
    description: '',
    startDate: localValue(new Date(Date.now())),
    endDate: localValue(new Date(Date.now() + 86400000)),
    options: ['', ''],
  });
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(polls));
  }, [polls]);
  useEffect(() => {
    const id = setInterval(() => setTime(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);
  const poll = polls.find((p) => p.id === selectedPoll) || polls[0];
  const myVote = poll?.votes.find((v) => v.userId === USER);
  const total = poll?.votes.length || 0;
  const counts = useMemo(
    () =>
      poll?.options.map((o) => ({
        ...o,
        count: poll.votes.filter((v) => v.optionId === o.id).length,
      })) || [],
    [poll],
  );
  const notify = (s) => {
    setMessage(s);
  };
  const selectPoll = (id) => {
    setSelectedPoll(id);
    setOptionId(null);
    setMessage('');
  };
  const vote = () => {
    if (!poll || statusOf(poll, Date.now()) !== '진행 중')
      return notify('현재 참여할 수 없는 투표입니다.');
    if (myVote) return notify('이미 참여한 투표입니다.');
    if (optionId == null) return notify('선택지를 먼저 선택해 주세요.');
    setPolls((prev) =>
      prev.map((p) =>
        p.id === poll.id ? { ...p, votes: [...p.votes, { userId: USER, optionId }] } : p,
      ),
    );
    notify('투표가 저장되었습니다. 결과를 확인해 보세요.');
  };
  const create = (e) => {
    e.preventDefault();
    const options = form.options.map((s) => s.trim()).filter(Boolean);
    if (!form.title.trim() || options.length < 2)
      return notify('제목과 선택지 2개 이상을 입력해 주세요.');
    if (!(new Date(form.endDate) > new Date(form.startDate)))
      return notify('종료 시간은 시작 시간보다 늦어야 합니다.');
    const id = Math.max(0, ...polls.map((p) => p.id)) + 1;
    const next = {
      id,
      eventId: Number(form.eventId),
      eventName: events.find((e) => e.id === Number(form.eventId))?.name || '',
      title: form.title.trim(),
      description: form.description.trim(),
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      options: options.map((content, i) => ({ id: id * 1000 + i, content })),
      votes: [],
    };
    setPolls((prev) => [next, ...prev]);
    selectPoll(id);
    setTab('vote');
    notify('투표가 생성되었습니다.');
    setForm((f) => ({ ...f, title: '', description: '', options: ['', ''] }));
  };
  const reset = () => {
    if (!window.confirm('데모 데이터를 초기화할까요?')) return;
    setPolls(initial);
    selectPoll(1);
    notify('데모 데이터를 초기화했습니다.');
  };
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-black text-white">
              E
            </div>
            <div>
              <div className="font-extrabold tracking-tight">
                EMS <span className="font-medium text-slate-400">/ INTERACTION</span>
              </div>
              <div className="text-xs text-slate-500">이벤트 실시간 투표</div>
            </div>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
            ● 데모 모드 · 서버 미연결
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold text-indigo-600">EVENT ENGAGEMENT</p>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">실시간 투표</h1>
          <p className="mt-3 text-slate-500">
            행사의 의견을 모으고, 투표 결과를 한눈에 확인하세요.
          </p>
        </div>
        <div className="mb-7 flex gap-2 border-b border-slate-200">
          {[
            ['vote', '투표 참여'],
            ['result', '결과 확인'],
            ['create', '투표 생성 · 주최자'],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`cursor-pointer border-b-2 px-4 py-3 text-sm font-semibold transition ${tab === key ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
              onClick={() => {
                setTab(key);
                setMessage('');
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {message && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-800"
          >
            {message}
          </div>
        )}
        {tab === 'create' ? (
          <section className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-1 text-xl font-bold">새 투표 만들기</h2>
            <p className="mb-7 text-sm text-slate-500">
              주최 행사에 연결할 투표를 생성합니다. (권한 검증은 서버 연결 후 적용)
            </p>
            <form onSubmit={create} className="space-y-5">
              <Field label="행사 선택">
                <select
                  value={form.eventId}
                  onChange={(e) => setForm({ ...form, eventId: e.target.value })}
                  className="control"
                >
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="투표 제목">
                <input
                  className="control"
                  maxLength={255}
                  placeholder="예: 가장 기대되는 세션은?"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </Field>
              <Field label="투표 설명 (선택)">
                <textarea
                  className="control min-h-24"
                  placeholder="투표에 대한 간단한 안내"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="시작 일시">
                  <input
                    className="control"
                    type="datetime-local"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </Field>
                <Field label="종료 일시">
                  <input
                    className="control"
                    type="datetime-local"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="선택지 (최소 2개)">
                <div className="space-y-2">
                  {form.options.map((value, i) => (
                    <div className="flex gap-2" key={i}>
                      <input
                        className="control"
                        maxLength={500}
                        placeholder={`선택지 ${i + 1}`}
                        value={value}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            options: form.options.map((v, j) => (j === i ? e.target.value : v)),
                          })
                        }
                      />
                      <button
                        type="button"
                        aria-label={`선택지 ${i + 1} 삭제`}
                        disabled={form.options.length <= 2}
                        onClick={() =>
                          setForm({ ...form, options: form.options.filter((_, j) => i !== j) })
                        }
                        className="rounded-lg border px-3 text-slate-500 disabled:opacity-30"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, options: [...form.options, ''] })}
                  className="mt-3 cursor-pointer text-sm font-semibold text-indigo-600"
                >
                  + 선택지 추가
                </button>
              </Field>
              <button type="submit" className="primary w-full">
                투표 생성하기
              </button>
            </form>
          </section>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[310px_minmax(0,1fr)]">
            <aside className="self-start rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold">투표 목록</h2>
                <span className="text-xs text-slate-400">{polls.length}개</span>
              </div>
              <div className="space-y-2">
                {polls.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => selectPoll(p.id)}
                    className={`w-full cursor-pointer rounded-xl border p-4 text-left transition ${poll?.id === p.id ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    <span className="text-xs text-slate-500">{p.eventName}</span>
                    <div className="mt-1 font-semibold">{p.title}</div>
                    <div className="mt-3 flex items-center justify-between">
                      <Status status={statusOf(p, time)} />
                      <span className="text-xs text-slate-400">참여 {p.votes.length}명</span>
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={reset}
                className="mt-5 cursor-pointer text-xs text-slate-400 underline"
              >
                데모 데이터 초기화
              </button>
            </aside>
            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              {poll && (
                <>
                  <div className="mb-5 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-indigo-600">{poll.eventName}</span>
                    <Status status={statusOf(poll, time)} />
                  </div>
                  <h2 className="text-2xl font-extrabold">{poll.title}</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {poll.description || '설명이 없는 투표입니다.'}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-4 border-b border-slate-100 pb-6 text-xs text-slate-500">
                    <span>시작 {fmt(poll.startDate)}</span>
                    <span>종료 {fmt(poll.endDate)}</span>
                    <span>총 {total}명 참여</span>
                  </div>
                  {tab === 'vote' ? (
                    <div className="pt-6">
                      <h3 className="mb-4 font-bold">선택지를 골라주세요</h3>
                      <div className="space-y-3">
                        {poll.options.map((o) => (
                          <label
                            key={o.id}
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${optionId === o.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'} ${myVote || statusOf(poll, time) !== '진행 중' ? 'cursor-not-allowed opacity-65' : ''}`}
                          >
                            <input
                              type="radio"
                              name="option"
                              disabled={!!myVote || statusOf(poll, time) !== '진행 중'}
                              checked={optionId === o.id || (!!myVote && myVote.optionId === o.id)}
                              onChange={() => setOptionId(o.id)}
                              className="accent-indigo-600"
                            />
                            <span className="font-medium">{o.content}</span>
                          </label>
                        ))}
                      </div>
                      <button
                        onClick={vote}
                        disabled={!!myVote || statusOf(poll, time) !== '진행 중'}
                        className="primary mt-6 w-full disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        {myVote
                          ? '이미 투표에 참여했습니다'
                          : statusOf(poll, time) === '예정'
                            ? '투표 시작 전입니다'
                            : statusOf(poll, time) === '종료'
                              ? '종료된 투표입니다'
                              : '투표 제출하기'}
                      </button>
                      <button
                        onClick={() => {
                          setTab('result');
                          setMessage('');
                        }}
                        className="mt-3 w-full cursor-pointer py-2 text-sm font-semibold text-indigo-600"
                      >
                        결과 확인하기 →
                      </button>
                    </div>
                  ) : (
                    <div className="pt-6">
                      <div className="mb-6 flex items-center justify-between">
                        <h3 className="font-bold">투표 결과</h3>
                        <span className="text-sm text-slate-500">총 {total}표</span>
                      </div>
                      <div className="space-y-6">
                        {counts.map((o) => (
                          <div key={o.id}>
                            <div className="mb-2 flex justify-between gap-3 text-sm">
                              <span className="font-semibold">{o.content}</span>
                              <span className="font-semibold text-slate-700">
                                {total ? Math.round((o.count / total) * 100) : 0}%{' '}
                                <span className="font-normal text-slate-400">({o.count}표)</span>
                              </span>
                            </div>
                            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                                style={{ width: `${total ? (o.count / total) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="mt-8 rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-500">
                        현재는 브라우저의 임시 데이터로 결과를 계산합니다. 서버 연결 후
                        WebSocket으로 실시간 갱신됩니다.
                      </p>
                      <button
                        onClick={() => {
                          setTab('vote');
                          setMessage('');
                        }}
                        className="mt-5 cursor-pointer text-sm font-semibold text-indigo-600"
                      >
                        ← 투표 화면으로
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        )}
        <p className="mt-8 text-center text-xs text-slate-400">
          데모 계정 1명 · 브라우저 로컬 저장 · 실제 로그인 / 행사 참가 승인 / 다중 사용자 동기화
          미구현
        </p>
      </main>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}
function Status({ status }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status === '진행 중' ? 'bg-emerald-100 text-emerald-700' : status === '예정' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}
    >
      {status}
    </span>
  );
}
