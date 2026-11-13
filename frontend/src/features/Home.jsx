import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './member/hooks/useAuth.js';
import { eventApi } from './event/api/eventApi.js';
import { formatShort, STATUS_BADGE } from './event/utils/format.js';
import logo from '../components/img/SYNC5trans.png';
import './home.css';
import ChatBot from '../components/chatbot/ChatBot.jsx';

const Home = () => {
  const { accessToken, authLoading, role, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const canCreate = Boolean(accessToken && role === 'ADMIN');
  const createDestination = authLoading
    ? '/events'
    : canCreate
      ? '/admin/events'
      : accessToken
        ? '/events'
        : '/login';

  useEffect(() => {
    let active = true;
    eventApi
      .list({ status: 'OPEN', page: 0, size: 3 })
      .then((data) => {
        if (active)
          setEvents(Array.isArray(data) ? data.slice(0, 3) : (data?.content ?? []).slice(0, 3));
      })
      .catch(() => {
        if (active) setEventsError(true);
      })
      .finally(() => {
        if (active) setEventsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('로그아웃 서버 요청 실패:', error);
    } finally {
      setLoggingOut(false);
    }
  };
  const trackRef = useRef(null);
  const groupRef = useRef(null);
  const dragRef = useRef(null);

  const handlePointerDown = (event) => {
    // 마우스 왼쪽 버튼 또는 터치/펜의 주 포인터만 드래그 처리
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;

    const animation =
      trackRef.current
        ?.getAnimations()
        .find((item) => item.effect?.getTiming()?.iterations === Infinity) ??
      trackRef.current?.getAnimations()[0];
    const groupWidth = groupRef.current?.getBoundingClientRect().width;

    const duration = Number(animation?.effect?.getComputedTiming()?.duration);
    if (!animation || !groupWidth || !Number.isFinite(duration) || duration <= 0) return;

    animation.pause();

    dragRef.current = {
      startX: event.clientX,
      startTime: animation.currentTime ?? 0,
      duration,
      groupWidth,
      animation,
    };

    if (event.currentTarget.setPointerCapture)
      event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current || !event.isPrimary) return;

    const animation = dragRef.current.animation;
    if (!animation) return;

    const { startX, startTime, duration, groupWidth } = dragRef.current;

    const distance = event.clientX - startX;
    // drag 감도
    const speed = 1.2;

    // 드래그한 거리만큼 애니메이션 위치 변경
    const nextTime = startTime - ((distance * speed) / groupWidth) * duration;

    // 무한 반복 범위 유지
    animation.currentTime = ((nextTime % duration) + duration) % duration;
  };

  const handlePointerUp = (event) => {
    if (!dragRef.current) return;

    const { animation } = dragRef.current;
    dragRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (animation.playState === 'paused') animation.play();
  };

  const handleLostPointerCapture = () => {
    if (!dragRef.current) return;

    const { animation } = dragRef.current;
    dragRef.current = null;
    if (animation.playState === 'paused') animation.play();
  };

  return (
    <div className="ems-home">
      <header className="home-topbar w-full bg-ems-sidebar text-white">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-y-3 px-6 py-4 lg:h-[88px] lg:flex-nowrap lg:py-0">
          {/* 로고 */}
          <Link to="/" className="shrink-0">
            <img src={logo} alt="SYNC5" className="h-[48px] w-auto object-contain lg:h-[64px]" />
          </Link>

          {/* 메뉴 */}
          <nav
            aria-label="메인 메뉴"
            className="order-3 flex w-full items-center justify-around gap-3 border-t border-white/10 pt-3 text-[13px] font-medium lg:order-none lg:w-auto lg:justify-center lg:gap-10 lg:border-0 lg:pt-0"
          >
            <Link to="/" className="transition-colors hover:text-ems-primary">
              홈
            </Link>

            <Link to={createDestination} className="transition-colors hover:text-ems-primary">
              {accessToken && !canCreate ? '행사 탐색' : '개최 Event'}
            </Link>

            <Link to="/events" className="transition-colors hover:text-ems-primary">
              검색
            </Link>
          </nav>

          {/* 인증 메뉴 */}
          <div className="flex shrink-0 items-center gap-3 text-[13px] font-medium lg:gap-5">
            {!authLoading &&
              (accessToken ? (
                <>
                  <Link to="/mypage" className="transition-colors hover:text-ems-primary">
                    마이페이지
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="transition-colors hover:text-ems-primary"
                  >
                    {loggingOut ? '로그아웃 중...' : '로그아웃'}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="transition-colors hover:text-ems-primary">
                    로그인
                  </Link>

                  <Link
                    to="/signup"
                    className="rounded-lg bg-ems-primary px-3 py-2 font-semibold text-white transition-colors hover:bg-ems-member-primary-hover"
                  >
                    회원가입
                  </Link>
                </>
              ))}
          </div>
        </div>
      </header>

      <main className="home-main bg-white">
        {/* Hero */}
        <section className="relative overflow-hidden bg-(--ems-green-soft) px-6 py-20 sm:py-28">
          <div className="pointer-events-none absolute -right-24 -top-32 h-[450px] w-[450px] rounded-full bg-ems-primary/10 blur-3xl" />

          <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-[13px] font-bold tracking-widest text-ems-primary">
                SYNC5 EVENT PLATFORM
              </p>
              <h1 className="mt-5 text-[36px] font-extrabold leading-tight text-ems-text sm:text-[48px]">
                이벤트의 시작부터
                <br />
                참여의 순간까지
              </h1>
              <p className="mt-6 max-w-[520px] text-[15px] leading-8 text-ems-muted">
                이벤트를 탐색하고 참가를 신청하세요. 주최자는 행사를 만들고 참가자를 관리할 수
                있습니다.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  to="/events"
                  className="rounded-xl bg-ems-primary px-7 py-3.5 text-[14px] font-semibold text-white transition-colors hover:bg-ems-member-primary-hover"
                >
                  이벤트 둘러보기
                </Link>
                <Link
                  to={createDestination}
                  className="rounded-xl border border-ems-member-input-border bg-white px-7 py-3.5 text-[14px] font-semibold text-ems-text transition-colors hover:bg-ems-background"
                >
                  {authLoading
                    ? '이벤트 둘러보기'
                    : accessToken && !canCreate
                      ? '행사 목록 보기'
                      : '이벤트 개최하기'}
                </Link>
              </div>
            </div>

            {/* ChatBot */}
            <ChatBot />
          </div>
        </section>

        {/* 이벤트 목록 */}
        <section id="events" className="bg-ems-background px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-[1200px]">
            {/* 제목 */}
            <div className="mb-10">
              <p className="text-[13px] font-bold tracking-widest text-ems-primary">
                LIVE & UPCOMING
              </p>

              <h2 className="mt-3 text-[30px] font-bold text-ems-text">지금 주목할 이벤트</h2>

              <p className="mt-3 text-[14px] text-ems-muted">다양한 이벤트를 만나보세요.</p>
            </div>

            {/* Event Service 실제 목록. 샘플 데이터와 섞지 않는다. */}
            {eventsLoading && (
              <p className="py-10 text-center text-ems-muted" role="status">
                이벤트를 불러오는 중입니다.
              </p>
            )}
            {!eventsLoading && eventsError && (
              <div
                role="alert"
                className="rounded-2xl border border-ems-border bg-white p-8 text-center text-ems-muted"
              >
                현재 이벤트 정보를 불러올 수 없습니다. 행사 목록에서 다시 확인해 주세요.
              </div>
            )}
            {!eventsLoading && !eventsError && events.length === 0 && (
              <p className="rounded-2xl border border-ems-border bg-white p-8 text-center text-ems-muted">
                현재 모집 중인 이벤트가 없습니다.
              </p>
            )}
            {!eventsLoading && !eventsError && events.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {events.map((event, index) => {
                  const badge = STATUS_BADGE[event.status] ?? STATUS_BADGE.OPEN;
                  const capacity = Math.max(0, Number(event.capacity) || 0);
                  const participants = Math.max(
                    0,
                    Number(event.participants ?? event.registeredCount ?? 0) || 0,
                  );
                  return (
                    <Link
                      to={`/events/${encodeURIComponent(event.id)}`}
                      key={event.id}
                      className="home-event-card group flex flex-col overflow-hidden rounded-[20px] border border-ems-member-input-border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-ems-primary"
                    >
                      <div
                        className={`relative flex h-[175px] items-center justify-center ${index % 2 === 0 ? 'bg-ems-member-primary-soft' : 'bg-(--ems-blue-soft)'}`}
                      >
                        <span className="text-[58px]" aria-hidden="true">
                          {['📅', '🎟️', '💻'][index % 3]}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col p-6">
                        <span
                          className={`w-fit rounded-full px-3 py-1 text-[11px] font-semibold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                        <h3 className="mt-5 text-[18px] font-bold text-ems-text">{event.title}</h3>
                        <p className="mt-5 text-[13px] text-ems-muted">
                          📅{' '}
                          {event.startsAt && !Number.isNaN(Date.parse(event.startsAt))
                            ? formatShort(event.startsAt)
                            : '일정 미정'}
                        </p>
                        <div className="mt-auto border-t border-ems-member-input-border pt-5">
                          <p className="text-[12px] text-ems-muted">
                            정원 {capacity > 0 ? `${capacity}명` : '미정'}
                            {event.participants != null || event.registeredCount != null
                              ? ` · 신청 ${participants}명`
                              : ''}
                          </p>
                          {capacity > 0 &&
                            (event.participants != null || event.registeredCount != null) && (
                              <div className="mt-3 h-[6px] overflow-hidden rounded-full bg-ems-member-input-border">
                                <div
                                  className="h-full rounded-full bg-ems-primary"
                                  style={{
                                    width: `${Math.min(100, (participants / capacity) * 100)}%`,
                                  }}
                                />
                              </div>
                            )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
            <div className="mt-8 text-center">
              <Link
                to="/events"
                className="inline-block rounded-xl bg-ems-primary px-6 py-3 text-[14px] font-semibold text-white hover:bg-ems-member-primary-hover"
              >
                전체 이벤트 둘러보기
              </Link>
            </div>
          </div>
        </section>

        {/* 서비스 소개 */}
        <section id="features" className="px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-[1200px]">
            <div className="mb-12">
              <p className="text-[13px] font-bold tracking-widest text-ems-primary">OUR FEATURES</p>

              <h2 className="mt-4 text-[30px] font-bold text-ems-text sm:text-[36px]">
                이벤트의 모든 순간을 하나로
              </h2>

              <p className="mt-4 text-[15px] leading-7 text-ems-muted">
                행사 개최부터 참여와 운영까지, SYNC5에서 하나의 흐름으로 경험하세요.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  number: '01',
                  category: 'EVENT',
                  icon: '📅',
                  title: '행사 관리',
                  description: '이벤트와 세션을 구성하고 참가 신청을 관리할 수 있습니다.',
                  color: 'bg-ems-member-primary-soft',
                },
                {
                  number: '02',
                  category: 'INTERACTION',
                  icon: '📡',
                  title: '실시간 참여',
                  description: '실시간 투표와 참여 기능을 통해 더욱 생생하게 소통하세요.',
                  color: 'bg-(--ems-blue-soft)',
                },
                {
                  number: '03',
                  category: 'ANALYTICS',
                  icon: '📊',
                  title: '데이터 분석',
                  description: '이벤트 운영 현황과 참여 데이터를 한눈에 확인하세요.',
                  color: 'bg-[#f1eafd]',
                },
              ].map((feature) => (
                <article
                  key={feature.number}
                  className="group flex h-full flex-col rounded-[20px] border border-ems-member-input-border bg-white p-7 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-[#b9dfca] hover:shadow-xl hover:shadow-[#142238]/5"
                >
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${feature.color} transition-transform duration-300 group-hover:scale-110`}
                  >
                    <span className="text-[26px]">{feature.icon}</span>
                  </div>

                  <h3 className="mt-7 text-[20px] font-bold text-ems-text">{feature.title}</h3>

                  <p className="mt-4 flex-1 text-[14px] leading-7 text-ems-muted">
                    {feature.description}
                  </p>

                  <div className="mt-8 border-t border-[#eef1f5] pt-4">
                    <span className="text-[12px] font-bold tracking-wider text-ems-primary">
                      {feature.number} / {feature.category}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 사용 흐름 */}
        <section className="bg-ems-background px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-[1200px]">
            <div className="text-center">
              <p className="text-[13px] font-bold tracking-widest text-ems-primary">HOW IT WORKS</p>

              <h2 className="mt-4 text-[30px] font-bold text-ems-text sm:text-[36px]">
                쉽고 간편한 이벤트 경험
              </h2>

              <p className="mt-4 text-[15px] text-ems-muted">
                원하는 이벤트를 찾고, 신청하고, 참여하세요.
              </p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {[
                {
                  step: 'STEP 01',
                  title: '이벤트 탐색',
                  description: '관심 있는 행사와 세션을 찾아보세요.',
                },
                {
                  step: 'STEP 02',
                  title: '참가 신청',
                  description: '원하는 이벤트에 간편하게 신청하세요.',
                },
                {
                  step: 'STEP 03',
                  title: '이벤트 참여',
                  description: '다양한 프로그램에 참여하고 소통하세요.',
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <span className="text-[14px] font-bold text-ems-primary">
                      {item.step.split(' ')[1]}
                    </span>
                  </div>

                  <p className="mt-6 text-[12px] font-bold tracking-wider text-ems-primary">
                    {item.step}
                  </p>

                  <h3 className="mt-3 text-[19px] font-bold text-ems-text">{item.title}</h3>

                  <p className="mt-3 text-[14px] leading-7 text-ems-muted">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 하단 CTA */}
        <section className="bg-(--ems-green-soft) px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-[1200px] text-center">
            <h2 className="text-[28px] font-bold text-ems-text sm:text-[36px]">
              새로운 이벤트 경험을 시작해 보세요
            </h2>

            <p className="mt-5 text-[15px] text-ems-muted">
              SYNC5와 함께 더 많은 가능성을 만나보세요.
            </p>

            <Link
              to={accessToken ? '/mypage' : authLoading ? '/events' : '/signup'}
              className="mt-8 inline-block rounded-xl bg-ems-primary px-8 py-3.5 text-[14px] font-semibold text-white transition hover:bg-ems-member-primary-hover"
            >
              {accessToken ? '마이페이지로 이동' : authLoading ? '이벤트 둘러보기' : '시작하기'}
            </Link>
          </div>
        </section>

        {/* Team Carousel */}
        <section className="overflow-hidden bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-[1200px] px-6 text-center mb-5">
            <p className="text-[13px] font-bold tracking-widest text-ems-primary">OUR TEAM</p>

            <h2 className="mt-4 text-[30px] font-bold text-ems-text">SYNC5 팀원들</h2>

            <p className="mt-4 text-[14px] text-ems-muted">
              다섯 명의 팀원이 함께 만들어가는 이벤트 플랫폼
            </p>
          </div>

          <div
            className="team-carousel mt-12"
            aria-label="SYNC5 팀원 소개"
            style={{ touchAction: 'pan-y' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onLostPointerCapture={handleLostPointerCapture}
          >
            <div ref={trackRef} className="team-carousel-track">
              {Array.from({ length: 2 }, (_, groupIndex) => (
                <div
                  key={groupIndex}
                  ref={groupIndex === 0 ? groupRef : null}
                  className="team-carousel-group"
                  aria-hidden={groupIndex === 1}
                >
                  {[
                    { name: '오좌언', role: '공통 인프라 · 통합', initials: 'OJ' },
                    { name: '하진철', role: 'Member · 인증', initials: 'HJ' },
                    { name: '박천보', role: 'Interaction · 투표', initials: 'PC' },
                    { name: '이도형', role: 'Event · 참가 승인', initials: 'DH' },
                    { name: '이도관', role: 'Event · 행사 관리', initials: 'DG' },
                  ].map((member) => (
                    <article
                      key={member.name}
                      className="flex h-[170px] w-[190px] shrink-0 flex-col items-center justify-center rounded-2xl border border-ems-member-input-border bg-ems-background p-4 text-center transition-shadow hover:shadow-lg sm:h-[190px] sm:w-[220px] sm:p-5"
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ems-member-primary-soft text-[17px] font-bold text-ems-primary">
                        {member.initials}
                      </div>

                      <h3 className="mt-4 text-[16px] font-bold text-ems-text">{member.name}</h3>

                      <p className="mt-2 text-[12px] text-ems-muted">{member.role}</p>
                    </article>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="home-footer bg-ems-sidebar px-6 py-14 text-white">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-10 md:grid-cols-[1fr_auto] md:gap-20">
            {/* 브랜드 소개 */}
            <div>
              <Link
                to="/"
                className="home-footer-brand inline-block text-[28px] font-extrabold tracking-tight"
              >
                SYNC<span className="text-ems-primary">5</span>
              </Link>

              <p className="mt-3 text-[12px] font-medium tracking-wider text-[#a9b8cc]">
                CLOUD NATIVE EVENT PLATFORM
              </p>

              <p className="mt-6 max-w-[340px] text-[14px] leading-7 text-[#c0ccda]">
                이벤트의 시작부터 끝까지,
                <br />더 나은 경험을 연결합니다.
              </p>
            </div>

            {/* 바로가기 */}
            <div>
              <h3 className="text-[14px] font-bold">바로가기</h3>

              <nav className="mt-5 flex flex-col gap-4 text-[13px] text-[#a9b8cc]">
                <Link to="/" className="transition-colors hover:text-white">
                  홈
                </Link>

                <a
                  href="#events"
                  className="rounded-xl bg-ems-primary px-7 py-3.5 text-[14px] font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-ems-member-primary-hover hover:shadow-lg"
                >
                  이벤트 둘러보기
                </a>

                <Link
                  to={authLoading ? '/events' : accessToken ? '/mypage' : '/login'}
                  className="transition-colors hover:text-white"
                >
                  {accessToken ? '마이페이지' : '로그인'}
                </Link>

                {!authLoading && !accessToken && (
                  <Link to="/signup" className="transition-colors hover:text-white">
                    회원가입
                  </Link>
                )}
              </nav>
            </div>
          </div>

          {/* 하단 구분선 */}
          <div className="mt-12 border-t border-white/10 pt-6">
            <div className="flex flex-col justify-between gap-3 text-[12px] text-[#8fa2bb] sm:flex-row">
              <p>© 2026 SYNC5. All rights reserved.</p>
              <p>Event Management System</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
