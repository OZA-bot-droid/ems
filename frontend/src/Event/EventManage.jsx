// ADMIN / 09 · 행사 관리의 본문 (좌측 공통 헤더와 페이지 헤더는 상위 레이아웃에서 제공합니다.)
import { useEffect, useState } from 'react';
import { eventApi, getDevUser } from '../api.js';
import { formatShort, STATUS_BADGE } from '../format.js';
import EventFormModal from './EventFormModal.jsx';
import './event-manage.scss';

// 상태별 다음 단계 (DRAFT → OPEN → CLOSED, 되돌리기 없음)
const NEXT_STATUS = {
  DRAFT: { to: 'OPEN', label: '공개' },
  OPEN: { to: 'CLOSED', label: '마감' },
};

export default function EventManage() {
  const [page, setPage] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0);
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let alive = true;
    setError(null);
    eventApi
      .list({ page, size: 10 })
      .then((data) => alive && setResult(data))
      .catch((err) => alive && setError(err));
    return () => {
      alive = false;
    };
  }, [page, reload]);

  const refresh = (message) => {
    setNotice(message);
    setReload((current) => current + 1);
  };

  async function changeStatus(event) {
    const next = NEXT_STATUS[event.status];
    try {
      await eventApi.update(event.id, { status: next.to });
      setConfirm(null);
      refresh(`"${event.title}" 행사를 ${next.label}했습니다.`);
    } catch (err) {
      setNotice(`${err.message} (${err.code})`);
    }
  }

  async function remove(event) {
    try {
      await eventApi.remove(event.id);
      setConfirm(null);
      refresh(`"${event.title}" 행사를 삭제했습니다.`);
    } catch (err) {
      setNotice(`${err.message} (${err.code})`);
    }
  }

  const events = result?.content ?? [];
  const myId = String(getDevUser().id);
  const isMine = (event) => String(event.createdBy) === myId;

  return (
    <section className="event-manage-page" aria-label="행사 관리">
      <div className="event-manage-toolbar">
        <button className="event-manage-create" onClick={() => setModal({})} type="button">
          ＋ 행사 등록
        </button>
      </div>

      {notice && (
        <p className="event-manage-notice" role="status">
          {notice}
          <button onClick={() => setNotice(null)} aria-label="알림 닫기" type="button">
            ×
          </button>
        </p>
      )}

      <section className="event-manage-card" aria-labelledby="event-manage-title">
        <h2 id="event-manage-title">행사 목록 · 운영</h2>

        {error && (
          <p className="event-manage-feedback is-error" role="alert">
            행사 목록을 불러오지 못했습니다. ({error.code})
          </p>
        )}
        {!error && !result && <p className="event-manage-feedback">행사 목록을 불러오는 중이에요…</p>}
        {!error && result && events.length === 0 && (
          <p className="event-manage-feedback">
            아직 등록된 행사가 없습니다. ‘행사 등록’으로 시작하세요.
          </p>
        )}

        {events.length > 0 && (
          <ul className="event-manage-list">
            {events.map((event) => {
              const badge = STATUS_BADGE[event.status] ?? { label: event.status };
              const next = NEXT_STATUS[event.status];
              const isConfirming = confirm?.id === event.id;

              return (
                <li className="event-manage-row" key={event.id}>
                  <div className="event-manage-name">
                    <strong title={event.title}>{event.title}</strong>
                    <span>{formatShort(event.startsAt)} · 정원 {event.capacity}명</span>
                  </div>

                  <span className={`event-manage-status is-${event.status.toLowerCase()}`}>
                    {badge.label}
                  </span>

                  {isConfirming ? (
                    <div className="event-manage-confirm">
                      {confirm.type === 'status' ? (
                        <>
                          <span>{next.label}하면 되돌릴 수 없습니다. 계속할까요?</span>
                          <button onClick={() => changeStatus(event)} type="button">예</button>
                          <button onClick={() => setConfirm(null)} type="button">아니오</button>
                        </>
                      ) : (
                        <>
                          <span>정말 삭제할까요?</span>
                          <button className="is-danger" onClick={() => remove(event)} type="button">삭제</button>
                          <button onClick={() => setConfirm(null)} type="button">취소</button>
                        </>
                      )}
                    </div>
                  ) : !isMine(event) ? (
                    <span className="event-manage-readonly">다른 관리자의 행사</span>
                  ) : (
                    <div className="event-manage-actions">
                      <button onClick={() => setModal({ event })} type="button">수정</button>
                      <button
                        onClick={() => setNotice('세션 관리 화면은 아직 연결되어 있지 않습니다.')}
                        type="button"
                      >
                        세션 관리
                      </button>
                      <details className="event-manage-more">
                        <summary aria-label={`${event.title} 기타 관리 메뉴`}>···</summary>
                        <div>
                          {next && (
                            <button
                              onClick={() => setConfirm({ id: event.id, type: 'status' })}
                              type="button"
                            >
                              {next.label}
                            </button>
                          )}
                          <button
                            className="is-danger"
                            onClick={() => setConfirm({ id: event.id, type: 'delete' })}
                            type="button"
                          >
                            삭제
                          </button>
                        </div>
                      </details>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {result && result.totalPages > 1 && (
          <nav className="event-manage-pagination" aria-label="행사 목록 페이지 이동">
            <button disabled={page === 0} onClick={() => setPage(page - 1)} type="button">
              이전
            </button>
            <span>{page + 1} / {result.totalPages}</span>
            <button
              disabled={page + 1 >= result.totalPages}
              onClick={() => setPage(page + 1)}
              type="button"
            >
              다음
            </button>
          </nav>
        )}

        <p className="event-manage-note">
          행사 생성·수정 ADMIN 권한 검증 · 필수 필드 및 일정 유효성 검사
        </p>
      </section>

      {modal && (
        <EventFormModal
          event={modal.event}
          onClose={() => setModal(null)}
          onSaved={(saved) => {
            setModal(null);
            refresh(
              modal.event
                ? `"${saved.title}" 행사를 수정했습니다.`
                : `"${saved.title}" 행사를 등록했습니다. (작성 중)`,
            );
          }}
        />
      )}
    </section>
  );
}
