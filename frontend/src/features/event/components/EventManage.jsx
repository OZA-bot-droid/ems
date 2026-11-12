import { mapClassNames } from '../../../styles/classNames.js';
import style0 from '../styles/event-manage.module.scss';
const cx = value => mapClassNames(value, style0);
// ADMIN / 09 · 행사 관리의 본문 (좌측 공통 헤더와 페이지 헤더는 상위 레이아웃에서 제공합니다.)
import { useEffect, useState } from 'react';
import { eventApi } from '../api/eventApi.js';
import { useAuth } from '../../member/hooks/useAuth.js';
import { formatShort, STATUS_BADGE } from '../utils/format.js';
import EventFormModal from './EventFormModal.jsx';
import ApprovedListModal from './ApprovedListModal.jsx';
import EventDetail from './EventDetail.jsx';

// 상태별 다음 단계 (DRAFT → OPEN → CLOSED, 되돌리기 없음)
const NEXT_STATUS = {
  DRAFT: { to: 'OPEN', label: '공개' },
  OPEN: { to: 'CLOSED', label: '마감' },
};
// 배지에 보여 줄 "다음 상태" 이름 (STATUS_BADGE의 화면 이름과 같게)
const NEXT_LABEL = { DRAFT: '모집 중', OPEN: '마감' };

// 정렬 방법: 서버(Spring Pageable)에 ?sort=칸,방향 으로 보냄 → 여러 쪽으로 나뉘어 있어도 전체 기준으로 정렬됨
// 정렬 기준이 2개면 '|'로 이어 적음 → 보낼 때 나눠서 sort=…&sort=… 로 보냄
// status는 글자로 저장 → 내림차순이면 OPEN(모집 중) > DRAFT(작성 중) > CLOSED(마감)
const SORT_OPTIONS = [
  { value: 'status,desc|startsAt,asc', label: '모집 중 → 작성 중 → 마감' },
  { value: 'startsAt,asc', label: '시작일 빠른 순' },
  { value: 'startsAt,desc', label: '시작일 늦은 순' },
  { value: 'id,desc', label: '최근 등록 순' },
  { value: 'title,asc', label: '제목 순 (가나다)' },
  { value: 'capacity,desc', label: '정원 많은 순' },
];

export default function EventManage({ onManageSessions }) {
  const { memberId } = useAuth();
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState(SORT_OPTIONS[0].value);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0); // 숫자가 바뀌면 목록을 다시 불러옴
  const [modal, setModal] = useState(null); // null=닫힘, {}=새 행사, {event}=수정
  const [confirm, setConfirm] = useState(null); // 확인 중인 것: { id, type: 'delete' | 'status' }
  const [notice, setNotice] = useState(null); // 위쪽 알림 한 줄 { type: 'ok' | 'error', text }
  const [approvedFor, setApprovedFor] = useState(null); // 승인 명단을 보고 있는 행사 (null = 닫힘)
  const [detailId, setDetailId] = useState(null); // 상세 창으로 보고 있는 행사 번호 (null = 닫힘)

  useEffect(() => {
    let alive = true;
    setError(null);
    eventApi
      .mine({ page, size: 10, sort: sort.split('|') }) // 내가 만든 행사만 (다른 관리자의 행사는 서버에서 제외)
      .then((data) => alive && setResult(data))
      .catch((err) => alive && setError(err));
    return () => {
      alive = false;
    };
  }, [page, sort, reload]);

  const refresh = (message) => {
    setNotice({ type: 'ok', text: message });
    setReload((n) => n + 1);
  };

  async function changeStatus(event) {
    const next = NEXT_STATUS[event.status];
    try {
      await eventApi.update(event.id, { status: next.to });
      setConfirm(null);
      refresh(`"${event.title}" 행사를 ${next.label}했습니다.`);
    } catch (err) {
      setConfirm(null);
      setNotice({ type: 'error', text: `${err.message} (${err.code})` });
    }
  }

  async function remove(event) {
    try {
      await eventApi.remove(event.id);
      setConfirm(null);
      refresh(`"${event.title}" 행사를 삭제했습니다.`);
    } catch (err) {
      setConfirm(null);
      setNotice({ type: 'error', text: `${err.message} (${err.code})` });
    }
  }

  // [세션 관리]: 부모가 화면 전환을 넘겨주면 그걸 쓰고, 아니면 세션 관리 페이지로 이동
  const openSessions = (eventId) =>
    onManageSessions ? onManageSessions(eventId) : (window.location.href = `/admin/sessions?eventId=${eventId}`);

  const events = result?.content ?? [];
  const myId = String(memberId);
  const isMine = (event) => String(event.createdBy) === myId;

  return (
    <section className={cx("event-manage-page")} aria-label="행사 관리">
      <div className={cx("event-manage-toolbar")}>
        <label className={cx("event-manage-sort")}>
          <span>정렬</span>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(0); // 정렬을 바꾸면 첫 쪽부터
            }}
            aria-label="행사 목록 정렬"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button className={cx("event-manage-create")} onClick={() => setModal({})} type="button">
          ＋ 행사 등록
        </button>
      </div>

      {notice && (
        <p className={cx(`event-manage-notice${notice.type === 'error' ? ' is-error' : ''}`)} role="status">
          {notice.text}
          <button onClick={() => setNotice(null)} aria-label="알림 닫기" type="button">
            ×
          </button>
        </p>
      )}

      <section className={cx("event-manage-card")} aria-labelledby="event-manage-title">
        <h2 id="event-manage-title">행사 목록 · 운영</h2>

        {error && (
          <p className={cx("event-manage-feedback is-error")} role="alert">
            행사 목록을 불러오지 못했습니다. ({error.code})
          </p>
        )}
        {!error && !result && <p className={cx("event-manage-feedback")}>행사 목록을 불러오는 중이에요…</p>}
        {!error && result && events.length === 0 && (
          <p className={cx("event-manage-feedback")}>
            아직 등록된 행사가 없습니다. ‘행사 등록’으로 시작하세요.
          </p>
        )}

        {events.length > 0 && (
          <ul className={cx("event-manage-list")}>
            {events.map((event) => {
              const badge = STATUS_BADGE[event.status] ?? { label: event.status };
              const next = NEXT_STATUS[event.status];
              const isConfirming = confirm?.id === event.id;

              return (
                <li className={cx("event-manage-row")} key={event.id}>
                  <div className={cx("event-manage-name")}>
                    {/* 제목을 누르면 행사 상세를 창(모달)으로 띄움 → 행사 관리 화면에 그대로 머무름 */}
                    <button
                      className={cx("event-manage-title-link")}
                      onClick={() => setDetailId(event.id)}
                      title={`${event.title} 상세 보기`}
                      type="button"
                    >
                      <strong>{event.title}</strong>
                    </button>
                    <span>
                      {formatShort(event.startsAt)} · 정원 {event.capacity}명
                      {/* 작성 중 + 게시 예약이 있으면 언제 자동 공개되는지 안내 */}
                      {event.status === 'DRAFT' && event.postedDate && ` · ${formatShort(event.postedDate)} 자동 공개 예정`}
                    </span>
                  </div>
                  {/* 상태 배지: 내 행사이고 다음 단계가 있으면 눌러서 바꿈 (DRAFT → OPEN → CLOSED, 확인 후) */}
                  {isMine(event) && next ? (
                    <button
                      className={cx(`event-manage-status is-${event.status.toLowerCase()} is-clickable`)}
                      onClick={() => setConfirm({ id: event.id, type: 'status' })}
                      title={`눌러서 ${NEXT_LABEL[event.status]}(으)로 바꾸기`}
                      type="button"
                    >
                      {badge.label} <span aria-hidden="true">›</span>
                    </button>
                  ) : (
                    <span className={cx(`event-manage-status is-${event.status.toLowerCase()}`)}>
                      {badge.label}
                    </span>
                  )}

                  {isConfirming ? (
                    <div className={cx("event-manage-confirm")}>
                      {confirm.type === 'status' ? (
                        <>
                          <span>{next.label}하면 되돌릴 수 없습니다. 계속할까요?</span>
                          <button onClick={() => changeStatus(event)} type="button">예</button>
                          <button onClick={() => setConfirm(null)} type="button">아니오</button>
                        </>
                      ) : (
                        <>
                          <span>정말 삭제할까요?</span>
                          <button className={cx("is-danger")} onClick={() => remove(event)} type="button">삭제</button>
                          <button onClick={() => setConfirm(null)} type="button">취소</button>
                        </>
                      )}
                    </div>
                  ) : !isMine(event) ? (
                    <span className={cx("event-manage-readonly")}>다른 관리자의 행사</span>
                  ) : (
                    <div className={cx("event-manage-actions")}>
                      {/* 마감된 행사는 수정 불가 → [수정] 숨김, 세션은 보기만 */}
                      {event.status !== 'CLOSED' && (
                        <button onClick={() => setModal({ event })} type="button">수정</button>
                      )}
                      <button onClick={() => openSessions(event.id)} type="button">
                        {event.status === 'CLOSED' ? '세션 보기' : '세션 관리'}
                      </button>
                      {/* 공개된 적 있는 행사(모집 중·마감)만 신청이 있으므로, 작성 중일 때는 숨김 */}
                      {event.status !== 'DRAFT' && (
                        <button onClick={() => setApprovedFor(event)} type="button">승인 명단</button>
                      )}
                      <details className={cx("event-manage-more")}>
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
                            className={cx("is-danger")}
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
          <nav className={cx("event-manage-pagination")} aria-label="행사 목록 페이지 이동">
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


      </section>

      {approvedFor && <ApprovedListModal event={approvedFor} onClose={() => setApprovedFor(null)} />}

      {/* 행사 상세 창: 사용자 화면과 같은 EventDetail을 그대로 띄움 ([← 목록으로]·바깥 클릭 = 닫기) */}
      {detailId && (
        <div
          className={cx("fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(20,34,56,0.45)] px-4 py-10")}
          onClick={() => setDetailId(null)}
        >
          <div
            aria-label="행사 상세"
            aria-modal="true"
            className={cx("w-full max-w-[860px] rounded-[18px] bg-(--ems-bg) p-6")}
            onClick={(e) => e.stopPropagation()} // 안쪽 클릭은 닫히지 않게
            role="dialog"
          >
            <EventDetail eventId={detailId} key={detailId} onBack={() => setDetailId(null)} />
          </div>
        </div>
      )}

      {modal && (
        <EventFormModal
          event={modal.event}
          onClose={() => setModal(null)}
          onSaved={(saved, sessionResult) => {
            setModal(null);
            if (modal.event) return refresh(`"${saved.title}" 행사를 수정했습니다.`);
            // 새 등록: 함께 만든 세션 결과도 한 줄에
            const { created = 0, failed = [] } = sessionResult || {};
            const { published = false, publishError } = sessionResult || {};
            let message = `"${saved.title}" 행사를 등록했습니다. (${published ? '모집 중' : '작성 중'})`;
            if (publishError) message += ` 공개하지 못했습니다(${publishError}). 목록에서 [공개]를 눌러 주세요.`;
            if (created > 0) message += ` 세션 ${created}개 추가.`;
            if (failed.length > 0)
              message += ` 세션 ${failed.length}개는 추가하지 못했습니다(${failed
                .map((f) => `${f.title}: ${f.message}`)
                .join(' / ')}). [세션 관리]에서 다시 추가하세요.`;
            refresh(message);
          }}
        />
      )}
    </section>
  );
}
