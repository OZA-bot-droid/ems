// React 훅: 화면 상태 관리, 데이터 조회 및 의존성 변경 시 재실행 제어
import { useEffect, useState, useCallback } from 'react';
// URL 쿼리 파라미터 조회 및 관리자 화면 간 링크 이동
import { useSearchParams, Link } from 'react-router-dom';
// Interaction 기능 전용 REST API: 투표 목록·생성·활성화·종료
import { pollApi } from '../../api/pollApi.js';
// Event 기능 전용 REST API: 관리 행사·행사별 세션 조회
import { eventApi } from '../../../event/api/eventApi.js';
// 기존 공통 헤더의 SCSS 클래스명을 화면에 매핑하기 위한 스타일 모듈
import module0 from '../../../components/layout/header.module.scss';
import { mapClassNames } from '../../../../styles/classNames.js';
// SCSS Modules로 변환된 클래스명을 연결하는 보조 함수
const cx = (value) => mapClassNames(value, module0);
// 관리자 화면에서 사용하는 기존 공통 헤더 컴포넌트
import Header from '../../../../components/layout/LegacyHeader.jsx';

// Tailwind CSS 공통 스타일 문자열: 패널, 입력 필드, 기본 버튼
const panel = 'rounded-xl border border-slate-200 bg-white p-5 shadow-sm';
const field = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm';
const btn =
  'rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';
/**
 * 관리자 투표 관리 페이지.
 * URL 필터에 따라 투표를 조회하고, 행사/세션을 선택하여 투표를 생성하거나 상태를 변경한다.
 * 클라이언트 검증은 입력 편의를 위한 것이며 최종 소유권·권한 검사는 서버가 수행한다.
 */
export default function PollManagePage() {
  // URL의 ?eventId=...&sessionId=... 값을 투표 목록 조회 필터로 사용
  const [params] = useSearchParams();
  const eventFilter = params.get('eventId') || '';
  const sessionFilter = params.get('sessionId') || '';
  // page: 0부터 시작하는 현재 페이지 / rows: 현재 페이지의 투표 배열
  // pages: 전체 페이지 수 / loading: 목록 요청 진행 여부 / error: 사용자에게 표시할 오류 문구
  const [page, setPage] = useState(0),
    [rows, setRows] = useState([]),
    [pages, setPages] = useState(0),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  // events: 관리자 행사 목록 / sessions: 선택 행사에 속한 세션 목록
  // open: 투표 생성 폼 표시 여부 / busy: 생성·상태 변경 요청 중 중복 실행 방지
  const [events, setEvents] = useState([]),
    [sessions, setSessions] = useState([]),
    [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false);
  // form: 투표 생성 폼 입력값(행사·세션·질문·시간·결과 공개·선택지)
  // eventId/sessionId는 URL 필터를 초기값으로 사용하며, options는 최소 2개로 시작
  const [form, setForm] = useState({
    eventId: eventFilter,
    sessionId: sessionFilter,
    title: '',
    startsAt: '',
    endsAt: '',
    showLiveResults: true,
    options: ['', ''],
  });
  // update(key, value): 기존 폼 상태를 보존하면서 지정한 필드 하나만 변경
  const update = (key, value) => setForm((s) => ({ ...s, [key]: value }));
  /**
   * refresh(): 현재 URL 필터와 page에 맞는 관리자 투표 목록을 조회한다.
   * useCallback으로 의존성이 바뀔 때만 함수 참조를 갱신한다.
   */
  const refresh = useCallback(async () => {
    // 목록 요청 시작: 로딩 표시 및 직전 오류 초기화
    setLoading(true);
    setError('');
    try {
      // Interaction API: 10건 단위 페이지 조회, 값이 있는 필터만 조건에 포함
      const data = await pollApi.mine({
        page,
        size: 10,
        ...(eventFilter ? { eventId: eventFilter } : {}),
        ...(sessionFilter ? { sessionId: sessionFilter } : {}),
      });
      // 공통 API 응답의 페이지 데이터(content/totalPages)를 화면 상태에 저장
      setRows(data.content || []);
      setPages(data.totalPages || 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, eventFilter, sessionFilter]);
  // 페이지 번호 또는 URL 필터 변경 시 refresh가 갱신되어 목록을 다시 조회
  useEffect(() => {
    refresh();
  }, [refresh]);
  // URL 필터가 바뀌면 첫 페이지로 이동하고 생성 폼의 행사·세션 기본값 동기화
  useEffect(() => {
    setPage(0);
    setForm((s) => ({ ...s, eventId: eventFilter, sessionId: sessionFilter }));
  }, [eventFilter, sessionFilter]);
  // 최초 마운트 시 관리 가능한 행사 목록 조회 (드롭다운 선택지 구성)
  useEffect(() => {
    // 비동기 응답이 컴포넌트 언마운트 후 상태를 변경하지 않도록 하는 플래그
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
  // 생성 폼에서 행사를 바꿀 때 그 행사에 속한 세션 목록을 다시 로드
  useEffect(() => {
    // 행사가 선택되지 않았으면 이전 행사 세션을 제거
    if (!form.eventId) {
      setSessions([]);
      return;
    }
    let ok = true;
    // 선택된 행사 ID로 관리자 세션 목록 요청
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
  /**
   * create(e): 투표 생성 폼 제출 이벤트 처리.
   * 세션 존재 여부, 투표 시작·종료 시각, 선택지 수를 확인하고 REST API로 생성한다.
   */
  async function create(e) {
    // 브라우저 기본 폼 제출/페이지 새로고침 방지
    e.preventDefault();
    // 기존 생성/상태 변경 요청이 진행 중이면 중복 제출 차단
    if (busy) return;
    // session: 폼에서 선택한 세션의 운영 일정, start/end: 생성할 투표의 시작·종료 시각
    const session = sessions.find((s) => String(s.id) === String(form.sessionId));
    const start = new Date(form.startsAt),
      end = new Date(form.endsAt);
    // 조회된 세션에 선택 ID가 없으면 요청하지 않음
    if (!session) {
      setError('유효한 행사 및 세션을 선택하세요.');
      return;
    }
    // 투표는 미래에 시작하고, 종료는 시작 후이며, 세션 운영 시간 안에 있어야 함
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
    // 빈 선택지가 있거나 선택지 수가 2개 미만이면 제출 중단
    if (form.options.some((o) => !o.trim()) || form.options.length < 2) {
      setError('선택지 두 개 이상을 입력하세요.');
      return;
    }
    // API 요청 중 생성/상태 변경 버튼 잠금
    setBusy(true);
    setError('');
    try {
      // Interaction API: 숫자 ID, ISO 8601 시각, {content} 선택지 배열로 요청
      await pollApi.create({
        title: form.title.trim(),
        eventId: Number(form.eventId),
        sessionId: Number(form.sessionId),
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        showLiveResults: form.showLiveResults,
        options: form.options.map((content) => ({ content: content.trim() })),
      });
      // 생성 성공 시 폼을 닫고 현재 페이지 투표 목록 재조회
      setOpen(false);
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  /**
   * change(id, action): 투표 상태 변경 API 실행 후 목록 재조회.
   * id - 상태를 변경할 투표 ID
   * action - pollApi에서 실행할 상태 변경 메서드명
   */
  async function change(id, action) {
    setBusy(true);
    setError('');
    try {
      // 관리 버튼이 전달한 action에 해당하는 투표 상태 변경 메서드 호출
      await pollApi[action](id);
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  // 렌더링: 관리자 헤더 → 오류 안내 → 생성 폼(조건부) → 투표 목록·페이지 이동
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
        {/* API 또는 입력 검증 오류가 있으면 화면 상단에 알림 표시 */}
        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-red-700" role="alert">
            {error}
          </p>
        )}
        {/* open=true일 때만 투표 생성 폼 표시 */}
        {open && (
          <form className={panel + ' space-y-3'} onSubmit={create}>
            <h2 className="font-bold">투표 생성</h2>
            {/* 행사 변경 시 이전 세션 선택을 초기화하여 잘못된 조합 방지 */}
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
            {/* 선택지는 최소 2개 유지하며 각 항목을 추가·수정·삭제 가능 */}
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
            {/* showLiveResults: 투표 진행 중 결과 공개 여부 */}
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
        {/* 현재 행사·세션 필터에 해당하는 투표 목록 */}
        <section className={panel}>
          <h2 className="mb-4 font-bold">
            등록된 투표 {eventFilter && '(행사 ' + eventFilter + ')'}{' '}
            {sessionFilter && '(세션 ' + sessionFilter + ')'}
          </h2>
          {/* 로딩 → 빈 목록 → 투표 테이블 순으로 조건부 렌더링 */}
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
                  {/* p: 조회된 투표 한 건, canActivate/canClose는 API 응답의 버튼 활성화 여부 */}
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
          {/* 전체 페이지가 2개 이상일 때만 이전/다음 버튼 표시 */}
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
        {/* 프론트 검증과 별개로 서버에서 소유권·참가 승인 여부 최종 검증 */}
        <p className="text-xs text-slate-500">
          서버에서 Event 소유권과 실제 참가 승인 여부를 검증합니다.
        </p>
      </main>
    </div>
  );
}
