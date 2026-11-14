import { mapClassNames } from '../../../styles/classNames.js';
import style0 from '../styles/session-manage.module.scss';
const cx = value => mapClassNames(value, style0);
// ADMIN / 10 · 세션 관리 (Figma "ADMIN / 10 · 세션 관리")
// 흐름: 내 행사 목록 불러오기 → [행사 선택] → 그 행사의 정보 + 세션 목록 → 추가/수정/삭제는 모달·확인 후 다시 불러오기
// eventId(처음 선택할 행사)는 없어도 동작합니다. → 사이드바 [세션 관리]로 바로 들어와도 첫 행사가 선택됨
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventApi } from '../api/eventApi.js';
import { useAuth } from '../../member/hooks/useAuth.js';
import { formatRange, formatTimeRange, instantToKstInput, STATUS_BADGE } from '../utils/format.js';
import EventPicker from './EventPicker.jsx';
import SessionFormModal from './SessionFormModal.jsx';

export default function SessionManage({ eventId = null, onBack }) {
  const { memberId } = useAuth();
  const navigate = useNavigate();
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
      .mine({ page: 0, size: 100 }) // 내가 만든 행사만 (DRAFT 포함)
      .then((data) => {
        if (!alive) return;
        const mine = (data?.content ?? []).filter((e) => String(e.createdBy) === myId);
        setMyEvents(mine);
        // 처음 선택: ① 이미 고른 행사 → ② 주소로 받은 eventId → ③ 첫 행사
        // (로그인 정보가 늦게 와서 이 부분이 두 번 실행돼도 주소로 받은 행사를 잃지 않도록)
        setSelectedId((current) => {
          if (mine.some((e) => e.id === current)) return current;
          if (mine.some((e) => e.id === eventId)) return eventId;
          return mine[0]?.id ?? null;
        });
      })
      .catch((err) => alive && setError(err));
    return () => {
      alive = false;
    };
  }, [memberId, eventId]);

  // ② 선택한 행사의 정보 + 세션 목록
  // 행사 정보는 ①에서 받은 내 행사 목록에서 꺼내고, 세션은 관리자용 주소로 불러옴
  // → 작성 중(DRAFT) 행사도 정보·세션이 보이고 세션을 추가할 수 있음
  useEffect(() => {
    if (!selectedId || !myEvents) return;
    let alive = true;
    setError(null);
    setEvent(myEvents.find((e) => e.id === selectedId) ?? null);
    eventApi
      .manageSessions(selectedId)
      .then((list) => alive && setSessions(list))
      .catch((err) => alive && setError(err));
    return () => {
      alive = false;
    };
  }, [selectedId, reload, myEvents]);

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
    <section className={cx("session-manage-page")} aria-label="세션 관리">
      {onBack && (
        <button className={cx("session-manage-back")} onClick={onBack} type="button">
          ← 행사 관리로
        </button>
      )}

      <header className={cx("session-manage-header")}>
        <div>
          <h1>세션 관리</h1>
          <p>행사별 세션 추가 및 일정</p>
        </div>
        <span className={cx("session-manage-role")}>ADMIN</span>
      </header>

      {notice && (
        <p className={cx(`session-manage-notice${notice.type === 'error' ? ' is-error' : ''}`)} role="status">
          {notice.text}
          <button onClick={() => setNotice(null)} aria-label="알림 닫기" type="button">
            ×
          </button>
        </p>
      )}

      <section className={cx("session-manage-card")} aria-labelledby="session-manage-title">
        <h2 id="session-manage-title">행사별 세션 관리</h2>

        {/* 행사 선택 */}
        <label className={cx("session-manage-label")} htmlFor="session-event-select">
          행사 선택
        </label>
        {myEvents === null ? (
          <p className={cx("session-manage-feedback")}>행사 목록을 불러오는 중이에요…</p>
        ) : myEvents.length === 0 ? (
          <p className={cx("session-manage-feedback")}>
            내가 만든 행사가 없습니다. ‘행사 관리’에서 행사를 먼저 등록하세요.
          </p>
        ) : (
          <>
            {/* 상태 배지 · 제목(굵게) · 시작 일시(흐리게)를 구별해서 보여 주는 선택 상자 */}
            <EventPicker
              id="session-event-select"
              events={myEvents}
              value={selectedId}
              onChange={selectEvent}
            />
            {event && (
              <p className={cx("session-manage-event-meta")}>
                <span className={cx(`session-manage-status is-${event.status.toLowerCase()}`)}>{badge.label}</span>
                행사 시간 · {formatRange(event.startsAt, event.endsAt)}
              </p>
            )}
          </>
        )}

        {/* 등록된 세션 */}
        {error ? (
          <p className={cx("session-manage-feedback is-error")} role="alert">
            {error.status === 404 ? '행사를 찾을 수 없습니다.' : `세션 정보를 불러오지 못했습니다. (${error.code})`}
          </p>
        ) : (
          event && (
            <>
              <h3 className={cx("session-manage-subtitle")}>
                등록된 세션 <span>{sessions.length}개</span>
              </h3>

              {sessions.length === 0 ? (
                <p className={cx("session-manage-feedback")}>
                  {locked ? '등록된 세션이 없습니다.' : '아직 세션이 없습니다. ‘새 세션 등록’으로 시작하세요.'}
                </p>
              ) : (
                <ul className={cx("session-manage-list")}>
                  {sessions.map((session) => (
                    <li className={cx("session-manage-row")} key={session.id}>
                      <button className={cx("session-manage-poll")} type="button" onClick={()=>navigate(`/admin/polls?eventId=${selectedId}&sessionId=${session.id}`)}>투표 관리</button>
                      <span className={cx("session-manage-time")}>
                        {multiDay
                          ? formatRange(session.startsAt, session.endsAt)
                          : formatTimeRange(session.startsAt, session.endsAt).replace('–', '-')}
                      </span>
                      <strong className={cx("session-manage-name")} title={session.title}>
                        {session.title}
                      </strong>

                      {locked ? null : confirmId === session.id ? (
                        <div className={cx("session-manage-confirm")}>
                          <span>정말 삭제할까요?</span>
                          <button className={cx("is-danger")} onClick={() => remove(session)} type="button">
                            삭제
                          </button>
                          <button onClick={() => setConfirmId(null)} type="button">
                            취소
                          </button>
                        </div>
                      ) : (
                        <div className={cx("session-manage-actions")}>
                          <button onClick={() => setModal({ session })} type="button">
                            수정
                          </button>
                          <details className={cx("session-manage-more")}>
                            <summary aria-label={`${session.title} 기타 메뉴`}>···</summary>
                            <div>
                              <button className={cx("is-danger")} onClick={() => setConfirmId(session.id)} type="button">
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
                <p className={cx("session-manage-locked")}>마감된 행사라 세션을 볼 수만 있습니다.</p>
              ) : (
                <div className={cx("session-manage-footer")}>
                  <button className={cx("session-manage-create")} onClick={() => setModal({})} type="button">
                    ＋ 세션 등록
                  </button>
                </div>
              )}
            </>
          )
        )}
      </section>


      {modal && event && (
        <SessionFormModal
          event={event}
          session={modal.session}
          sessions={sessions}
          onClose={() => setModal(null)}
          onSaved={(saved, result) => {
            setModal(null);
            if (modal.session) return refresh(`"${saved.title}" 세션을 수정했습니다.`);
            // 새 등록: 여러 개를 한 번에 만들 수 있어서 결과를 한 줄로 알려 준다
            const { created = 1, failed = [] } = result || {};
            let message =
              created > 1 ? `세션 ${created}개를 추가했습니다.` : `"${saved.title}" 세션을 추가했습니다.`;
            if (failed.length > 0)
              message += ` ${failed.length}개는 추가하지 못했습니다(${failed
                .map((f) => `${f.title}: ${f.message}`)
                .join(' / ')}).`;
            refresh(message);
          }}
        />
      )}
    </section>
  );
}
