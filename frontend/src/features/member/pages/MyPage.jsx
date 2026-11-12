import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { mapClassNames } from '../../../styles/classNames.js';
import headerStyles from '../../../components/layout/header.module.scss';
import Header from '../../../components/layout/Header.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useApiUtil } from '../hooks/useApiUtil.js';
import { eventApi } from '../../event/api/eventApi.js';
import { registrationApi } from '../../event/api/registrationApi.js';

const cx = (value) => mapClassNames(value, headerStyles);

const MyPage = () => {
  const { authLoading, role } = useAuth();
  const apiReq = useApiUtil();
  const [member, setMember] = useState({
    email: '',
    name: '',
  });
  const [eventItems, setEventItems] = useState([]);
  const [eventLoading, setEventLoading] = useState(true);
  const [eventError, setEventError] = useState('');

  useEffect(() => {
    const myInfo = async () => {
      try {
        const res = await apiReq('/api/members/me', {
          method: 'GET',
        });

        if (res.status >= 200 && res.status < 300) {
          const data = res.data;
          console.log(data);
          setMember((m) => ({ ...m, ...data.data }));
        } else {
          console.log(res);
        }
      } catch (err) {
        console.log(err);
      }
    };
    myInfo();
  }, [authLoading]);

  useEffect(() => {
    if (authLoading) return undefined;
    let active = true;

    async function loadEventItems() {
      setEventLoading(true);
      setEventError('');
      try {
        if (role === 'ADMIN') {
          const page = await eventApi.mine({ page: 0, size: 5 });
          const rows = Array.isArray(page) ? page : (page?.content ?? []);
          if (active) setEventItems(rows.map((event) => ({ ...event, itemType: 'event' })));
        } else {
          const [registrationPage, eventPage] = await Promise.all([
            registrationApi.mine({ page: 0, size: 5 }),
            eventApi.list({ page: 0, size: 100 }).catch(() => null),
          ]);
          const registrations = Array.isArray(registrationPage)
            ? registrationPage
            : (registrationPage?.content ?? []);
          const events = Array.isArray(eventPage) ? eventPage : (eventPage?.content ?? []);
          const eventsById = Object.fromEntries(events.map((event) => [event.id, event]));
          if (active) {
            setEventItems(registrations.map((registration) => ({
              ...registration,
              title: registration.eventTitle || eventsById[registration.eventId]?.title || `행사 #${registration.eventId}`,
              itemType: 'registration',
            })));
          }
        }
      } catch (error) {
        if (active) setEventError(error.message || '행사 정보를 불러오지 못했습니다.');
      } finally {
        if (active) setEventLoading(false);
      }
    }

    loadEventItems();
    return () => { active = false; };
  }, [authLoading, role]);

  return (
    <div className={cx('app-shell')}>
      <Header role={role ?? 'COMMON'} activePage="mypage" />
      <main className={cx('app-main-content')}>
        <section className="flex min-w-0 justify-center px-6 py-10 sm:px-10 lg:px-12 lg:py-[65px]">
          <div className="w-full max-w-[900px]">
            <div className="mb-8">
              <h2 className="text-[28px] font-bold text-[#142238]">마이페이지</h2>
              <p className="mt-3 text-[13px] text-[#7a879a]">내 정보와 활동 내역을 확인하세요.</p>
            </div>

            {/* Member Service */}
            <section className="rounded-[14px] border border-[#e5e9f0] bg-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[17px] font-bold text-[#142238]">내 프로필</h3>
                <span className="rounded-full bg-[#e6f5ee] px-3 py-1 text-[11px] font-semibold text-[#169b62]">
                  MEMBER
                </span>
              </div>

              <p className="mt-2 text-[12px] text-[#7a879a]">기본 회원 정보</p>

              <div className="mt-5 space-y-4 border-t border-[#e5e9f0] pt-5">
                <div>
                  <p className="text-[12px] text-[#7a879a]">이름</p>
                  <p className="mt-1 text-[14px] font-medium text-[#142238]">{member.name}</p>
                </div>

                <div>
                  <p className="text-[12px] text-[#7a879a]">이메일</p>
                  <p className="mt-1 text-[14px] font-medium text-[#142238]">{member.email}</p>
                </div>
              </div>
            </section>

            {/* 다른 서비스가 사용할 공간 */}
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {/* Event Service */}
              <section className="rounded-[14px] border border-[#e5e9f0] bg-white p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#e6f5ee]">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 text-[#169b62]"
                      aria-hidden="true"
                    >
                      <rect x="3" y="5" width="18" height="16" rx="2" />
                      <path d="M7 3v4M17 3v4M3 10h18" />
                    </svg>
                  </div>

                  <div>
                    <h3 className="text-[15px] font-bold text-[#142238]">나의 행사</h3>
                    <p className="mt-1 text-[11px] text-[#7a879a]">Event Service</p>
                  </div>
                </div>

                <div className="mt-5 min-h-[120px] rounded-[10px] border border-[#e5e9f0] bg-[#f7f9fc] p-4">
                  {eventLoading ? (
                    <p className="py-8 text-center text-[12px] text-[#7a879a]">행사 정보를 불러오는 중이에요…</p>
                  ) : eventError ? (
                    <p className="py-8 text-center text-[12px] text-rose-600" role="alert">{eventError}</p>
                  ) : eventItems.length === 0 ? (
                    <p className="py-8 text-center text-[12px] text-[#7a879a]">
                      {role === 'ADMIN' ? '아직 주최한 행사가 없어요.' : '아직 참가 신청한 행사가 없어요.'}
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {eventItems.map((item) => {
                        const statusLabels = {
                          PENDING: '승인 대기', APPROVED: '승인 완료', REJECTED: '승인 거부', CANCELLED: '취소됨',
                          OPEN: '모집 중', CLOSED: '마감', DRAFT: '작성 중',
                        };
                        const to = role === 'ADMIN' ? `/events/${item.id}` : '/registrations';
                        return (
                          <li key={`${item.itemType}-${item.id}`}>
                            <Link className="flex items-center justify-between gap-3 rounded-[8px] bg-white px-3 py-3 text-[12px] hover:bg-[#eaf5ef]" to={to}>
                              <span className="min-w-0 truncate font-semibold text-[#142238]">{item.title}</span>
                              <span className="shrink-0 text-[#7a879a]">{statusLabels[item.status] || item.status}</span>
                            </Link>
                          </li>
                        );
                      })}
                      <li className="pt-1 text-right">
                        <Link className="text-[11px] font-semibold text-[#169b62] hover:underline" to={role === 'ADMIN' ? '/admin/events' : '/registrations'}>
                          {role === 'ADMIN' ? '행사 관리로 이동 →' : '신청 내역 전체 보기 →'}
                        </Link>
                      </li>
                    </ul>
                  )}
                </div>
              </section>

              {/* Interaction Service */}
              <section className="rounded-[14px] border border-[#e5e9f0] bg-white p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#e6f5ee]">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 text-[#169b62]"
                      aria-hidden="true"
                    >
                      <path d="M5 20V11M10 20V5M15 20v-8M20 20V8" />
                    </svg>
                  </div>

                  <div>
                    <h3 className="text-[15px] font-bold text-[#142238]">나의 참여 활동</h3>
                    <p className="mt-1 text-[11px] text-[#7a879a]">Interaction Service</p>
                  </div>
                </div>

                <div className="mt-5 flex min-h-[120px] items-center justify-center rounded-[10px] border border-dashed border-[#d9dee7] bg-[#f7f9fc] p-4">
                  <p className="text-center text-[12px] leading-6 text-[#7a879a]">
                    투표 및 참여 내역
                    <br />
                    연동 예정
                  </p>
                </div>
              </section>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MyPage;
