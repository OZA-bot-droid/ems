// ADMIN / 10 · 세션 관리 (Figma "ADMIN / 10 · 세션 관리")
// 흐름: 내 행사 목록 불러오기 → [행사 선택] → 그 행사의 정보 + 세션 목록 → 추가/수정/삭제는 모달·확인 후 다시 불러오기
// eventId(처음 선택할 행사)는 없어도 동작합니다. → 사이드바 [세션 관리]로 바로 들어와도 첫 행사가 선택됨
import { useEffect, useState } from 'react';
import { eventApi } from '../../api.js';
import { useAuth } from '../../page/AuthContext.jsx';
import { formatRange, formatTimeRange, instantToKstInput, STATUS_BADGE } from '../../format.js';
import SessionFormModal from './SessionFormModal.jsx';
import './session-manage.scss';

export default function SessionManage({ eventId = null, onBack }) {
  const { memberId } = useAuth();
  const [myEvents, setMyEvents] = useState(null); // 행사 선택 목록 (내가 만든 행사만)
  const [selectedId, setSelectedId] = useState(eventId);
  const [event, setEvent] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0); // 숫자가 바뀌면 세션을 다시 불러옴
  const [modal, setModal] = useState(null); // null=닫힘, {}=새 세션, {session}=수정
  const [confirmId, setConfirmId] = useState(null); // 삭제 확인 중인 세션 번호
  const [notice, setNotice] = useState(null); // { type: 'ok' | 'error', text }

  // ① 행사 선택 목록: 내가 만든 행사만 (세션은 행사를 만든 관리자만 관리 가능)
  useEffect(() => {
    let alive = true;
    const myId = String(memberId);
    eventApi
      .list({ page: 0, size: 100 })
      .then((data) => {
        if (!alive) return;
        const mine = (data?.content ?? []).filter((e) => String(e.createdBy) === myId);
        setMyEvents(mine);
        // 처음 선택: 받은 eventId가 내 행사면 그것, 아니면 첫 행사
        setSelectedId((current) => (mine.some((e) => e.id === current) ? current : mine[0]?.id ?? null));
      })
      .catch((err) => alive && setError(err));
    return () => {
      alive = false;
    };
  }, [memberId]);

  // ② 선택한 행사의 정보 + 세션 목록을 동시에
  useEffect(() => {
    if (!selectedId) return;
    let alive = true;
    setError(null);
    Promise.all([eventApi.get(selectedId), eventApi.sessions(selectedId)])
      .then(([ev, list]) => {
        if (!alive) return;
        setEvent(ev);
        setSessions(list);
      })
      .catch((err) => alive && setError(err));
    return () => {
      alive = false;
    };
  }, [selectedId, reload]);

  const refresh = (text) => {
    setNotice({ type: 'ok', text });
    setReload((n) => n + 1);
  };

  function selectEvent(id) {
    setSelectedId(Number(id));
    setEvent(null);
    setConfirmId(null);
    setNotice(null);
  }

  async function remove(session) {
    try {
      await eventApi.removeSession(selectedId, session.id);
      setConfirmId(null);
      refresh(`"${session.title}" 세션을 삭제했습니다.`);
    } catch (err) {
      setConfirmId(null);
      setNotice({ type: 'error', text: `${err.message} (${err.code})` });
    }
  }

  // 마감된 행사는 보기만 (서버도 EVENT_CLOSED 409로 막음)
  const locked = event?.status === 'CLOSED';
  const badge = event && (STATUS_BADGE[event.status] ?? { label: event.status });
  // 여러 날에 걸친 행사면 세션에 날짜도 표시
  const multiDay =
    event && instantToKstInput(event.startsAt).slice(0, 10) !== instantToKstInput(event.endsAt).slice(0, 10);

  return (
    <section className="session-manage-page" aria-label="세션 관리">
      {onBack && (
        <button className="session-manage-back" onClick={onBack} type="button">
          ← 행사 관리로
        </button>
      )}

      <header className="session-manage-header">
        <div>
          <h1>세션 관리</h1>
          <p>행사별 세션 추가 및 일정</p>
        </div>
        <span className="session-manage-role">ADMIN</span>
      </header>

      {notice && (
        <p className={`session-manage-notice${notice.type === 'error' ? ' is-error' : ''}`} role="status">
          {notice.text}
          <button onClick={() => setNotice(null)} aria-label="알림 닫기" type="button">
            ×
          </button>
        </p>
      )}

      <section className="session-manage-card" aria-labelledby="session-manage-title">
        <h2 id="session-manage-title">행사별 세션 관리</h2>

        {/* 행사 선택 */}
        <label className="session-manage-label" htmlFor="session-event-select">
          행사 선택
        </label>
        {myEvents === null ? (
          <p className="session-manage-feedback">행사 목록을 불러오는 중이에요…</p>
        ) : myEvents.length === 0 ? (
          <p className="session-manage-feedback">
            내가 만든 행사가 없습니다. ‘행사 관리’에서 행사를 먼저 등록하세요.
          </p>
        ) : (
          <>
            <select
              id="session-event-select"
              className="session-manage-select"
              value={selectedId ?? ''}
              onChange={(e) => selectEvent(e.target.value)}
            >
              {myEvents.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
            {event && (
              <p className="session-manage-event-meta">
                <span className={`session-manage-status is-${event.status.toLowerCase()}`}>{badge.label}</span>
                행사 시간 · {formatRange(event.startsAt, event.endsAt)}
              </p>
            )}
          </>
        )}

        {/* 등록된 세션 */}
        {error ? (
          <p className="session-manage-feedback is-error" role="alert">
            {error.status === 404 ? '행사를 찾을 수 없습니다.' : `세션 정보를 불러오지 못했습니다. (${error.code})`}
          </p>
        ) : (
          event && (
            <>
              <h3 className="session-manage-subtitle">
                등록된 세션 <span>{sessions.length}개</span>
              </h3>

              {sessions.length === 0 ? (
                <p className="session-manage-feedback">
                  {locked ? '등록된 세션이 없습니다.' : '아직 세션이 없습니다. ‘새 세션 추가’로 시작하세요.'}
                </p>
              ) : (
                <ul className="session-manage-list">
                  {sessions.map((session) => (
                    <li className="session-manage-row" key={session.id}>
                      <span className="session-manage-time">
                        {multiDay
                          ? formatRange(session.startsAt, session.endsAt)
                          : formatTimeRange(session.startsAt, session.endsAt).replace('–', '-')}
                      </span>
                      <strong className="session-manage-name" title={session.title}>
                        {session.title}
                      </strong>

                      {locked ? null : confirmId === session.id ? (
                        <div className="session-manage-confirm">
                          <span>정말 삭제할까요?</span>
                          <button className="is-danger" onClick={() => remove(session)} type="button">
                            삭제
                          </button>
                          <button onClick={() => setConfirmId(null)} type="button">
                            취소
                          </button>
                        </div>
                      ) : (
                        <div className="session-manage-actions">
                          <button onClick={() => setModal({ session })} type="button">
                            수정
                          </button>
                          <details className="session-manage-more">
                            <summary aria-label={`${session.title} 기타 메뉴`}>···</summary>
                            <div>
                              <button className="is-danger" onClick={() => setConfirmId(session.id)} type="button">
                                삭제
                              </button>
                            </div>
                          </details>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {locked ? (
                <p className="session-manage-locked">마감된 행사라 세션을 볼 수만 있습니다.</p>
              ) : (
                <div className="session-manage-footer">
                  <button className="session-manage-create" onClick={() => setModal({})} type="button">
                    ＋ 새 세션 추가
                  </button>
                </div>
              )}
            </>
          )
        )}
      </section>

      <p className="session-manage-note">
        세션은 행사 시간 안에서만 · 다른 세션과 겹침 불가 (끝나는 시각에 바로 시작은 가능)
      </p>

      {modal && event && (
        <SessionFormModal
          event={event}
          session={modal.session}
          onClose={() => setModal(null)}
          onSaved={(saved) => {
            setModal(null);
            refresh(modal.session ? `"${saved.title}" 세션을 수정했습니다.` : `"${saved.title}" 세션을 추가했습니다.`);
          }}
        />
      )}
    </section>
  );
}
