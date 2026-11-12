import React, { useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const { accessToken, authLoading, logout } = useAuth();
  const trackRef = useRef(null);
  const groupRef = useRef(null);
  const dragRef = useRef(null);

  const handlePointerDown = (event) => {
    if (event.button !== 0) return;

    const animation = trackRef.current?.getAnimations()[0];
    const groupWidth = groupRef.current?.getBoundingClientRect().width;

    if (!animation || !groupWidth) return;

    animation.pause();

    dragRef.current = {
      startX: event.clientX,
      startTime: animation.currentTime ?? 0,
      duration: animation.effect.getTiming().duration,
      groupWidth,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current) return;

    const animation = trackRef.current?.getAnimations()[0];
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

    dragRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    trackRef.current?.getAnimations()[0]?.play();
  };

  const handleLostPointerCapture = () => {
    if (!dragRef.current) return;

    dragRef.current = null;
    trackRef.current?.getAnimations()[0]?.play();
  };

  return (
    <>
      <header className="w-full bg-[#111827] text-white">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-y-3 px-6 py-4 lg:h-[88px] lg:flex-nowrap lg:py-0">
          {/* 로고 */}
          <Link to="/" className="shrink-0">
            <img
              src="/sync5-logo.png"
              alt="SYNC5"
              className="h-[48px] w-auto object-contain lg:h-[64px]"
              onClick={() => navigate('/')}
            />
          </Link>

          {/* 메뉴 */}
          <nav
            aria-label="메인 메뉴"
            className="order-3 flex w-full items-center justify-around gap-3 border-t border-white/10 pt-3 text-[13px] font-medium lg:order-none lg:w-auto lg:justify-center lg:gap-10 lg:border-0 lg:pt-0"
          >
            <Link to="/" className="transition-colors hover:text-[#22c55e]">
              홈
            </Link>

            <Link to="/events/create" className="transition-colors hover:text-[#22c55e]">
              개최 Event
            </Link>

            <Link to="/events/search" className="transition-colors hover:text-[#22c55e]">
              검색
            </Link>
          </nav>

          {/* 인증 메뉴 */}
          <div className="flex shrink-0 items-center gap-3 text-[13px] font-medium lg:gap-5">
            {!authLoading &&
              (accessToken ? (
                <>
                  <Link to="/mypage" className="transition-colors hover:text-[#22c55e]">
                    마이페이지
                  </Link>

                  <button
                    type="button"
                    onClick={logout}
                    className="transition-colors hover:text-[#22c55e]"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="transition-colors hover:text-[#22c55e]">
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

      <main className="bg-white">
        {/* Hero */}
        <section className="relative overflow-hidden bg-[#f1f7f5] px-6 py-20 sm:py-28">
          <div className="pointer-events-none absolute -right-24 -top-32 h-[450px] w-[450px] rounded-full bg-ems-primary/10 blur-3xl" />

          <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-2">
            <div>{/* 기존 Hero 제목, 설명, 버튼 전체 */}</div>

            {/* 오른쪽 소개 패널 */}
            <div className="hidden rounded-[24px] border border-[#d6e3dc] bg-white/80 p-6 shadow-[0_20px_60px_rgba(20,34,56,0.06)] lg:block">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-bold tracking-wider text-ems-text">
                  EVENT EXPERIENCE
                </p>
                <span className="text-[24px]">✦</span>
              </div>

              <div className="mt-6 flex h-[190px] flex-col items-center justify-center rounded-2xl bg-[#e6f5ee]">
                <span className="text-[52px]">🎟️</span>
                <p className="mt-3 text-[18px] font-bold text-ems-text">함께하는 새로운 경험</p>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <p className="text-[13px] text-[#63758a]">탐색 · 신청 · 실시간 참여</p>
                <span className="text-[20px] text-[#169b62]">↗</span>
              </div>
            </div>
          </div>
        </section>

        {/* 이벤트 목록 */}
        <section id="events" className="bg-ems-background px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-[1200px]">
            {/* 제목 */}
            <div className="mb-10">
              <p className="text-[13px] font-bold tracking-widest text-[#169b62]">
                LIVE & UPCOMING
              </p>

              <h2 className="mt-3 text-[30px] font-bold text-ems-text">지금 주목할 이벤트</h2>

              <p className="mt-3 text-[14px] text-ems-muted">다양한 이벤트를 만나보세요.</p>
            </div>

            {/* 이벤트 카드 */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  id: 1,
                  title: '개발자 기술 컨퍼런스',
                  category: '컨퍼런스',
                  status: '모집 중',
                  date: '2026.11.21',
                  location: '온라인',
                  participants: 24,
                  capacity: 80,
                  color: 'bg-[#e6f5ee]',
                  icon: '💻',
                },
                {
                  id: 2,
                  title: '클라우드 아키텍처 세미나',
                  category: '세미나',
                  status: '모집 중',
                  date: '2026.11.28',
                  location: '온라인',
                  participants: 12,
                  capacity: 40,
                  color: 'bg-[#e8eef9]',
                  icon: '☁️',
                },
                {
                  id: 3,
                  title: '실전 AI 워크숍',
                  category: '워크숍',
                  status: '접수 예정',
                  date: '2026.12.05',
                  location: '오프라인',
                  participants: 0,
                  capacity: 30,
                  color: 'bg-[#f1eafd]',
                  icon: '🤖',
                },
              ].map((event) => (
                <article
                  key={event.id}
                  className="group flex flex-col overflow-hidden rounded-[20px] border border-[#e5e9f0] bg-white shadow-[0_4px_20px_rgba(20,34,56,0.04)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-[#b9dfca] hover:shadow-[0_16px_40px_rgba(20,34,56,0.1)]"
                >
                  {/* 이미지 영역 */}
                  <div
                    className={`relative flex h-[175px] items-center justify-center overflow-hidden ${event.color}`}
                  >
                    <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full border border-white/60" />
                    <div className="absolute -bottom-14 -left-10 h-40 w-40 rounded-full bg-white/20" />

                    <span className="relative text-[58px] transition-transform duration-500 ease-out group-hover:scale-110">
                      {event.icon}
                    </span>
                  </div>

                  {/* 정보 영역 */}
                  <div className="p-6">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[12px] font-semibold text-[#169b62]">
                        {event.category}
                      </span>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${
                          event.status === '모집 중'
                            ? 'bg-[#e6f5ee] text-[#169b62]'
                            : 'bg-[#fff4df] text-[#ac741c]'
                        }`}
                      >
                        {event.status}
                      </span>
                    </div>

                    <h3 className="mt-5 text-[18px] font-bold text-ems-text">{event.title}</h3>

                    <div className="mt-5 space-y-3 text-[13px] text-ems-muted">
                      <div className="flex items-center gap-2">
                        <span aria-hidden="true">📅</span>
                        <span>{event.date}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span aria-hidden="true">📍</span>
                        <span>{event.location}</span>
                      </div>
                    </div>

                    <div className="mt-6 border-t border-[#e5e9f0] pt-5">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-ems-muted">참가 인원</span>

                        <span className="text-[13px] font-semibold text-ems-text">
                          {event.participants} / {event.capacity}명
                        </span>
                      </div>

                      <div className="mt-3 h-[6px] overflow-hidden rounded-full bg-[#e5e9f0]">
                        <div
                          className="h-full rounded-full bg-ems-primary transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (event.participants / event.capacity) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <p className="mt-8 text-center text-[12px] text-ems-muted">
              현재 표시된 이벤트는 디자인 확인용 샘플입니다.
            </p>
          </div>
        </section>

        {/* 서비스 소개 */}
        <section id="features" className="px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-[1200px]">
            <div className="mb-12">
              <p className="text-[13px] font-bold tracking-widest text-[#169b62]">OUR FEATURES</p>

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
                  color: 'bg-[#e6f5ee]',
                },
                {
                  number: '02',
                  category: 'INTERACTION',
                  icon: '📡',
                  title: '실시간 참여',
                  description: '실시간 투표와 참여 기능을 통해 더욱 생생하게 소통하세요.',
                  color: 'bg-[#e8eef9]',
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
                  className="group flex h-full flex-col rounded-[20px] border border-[#e5e9f0] bg-white p-7 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-[#b9dfca] hover:shadow-xl hover:shadow-[#142238]/5"
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
                    <span className="text-[12px] font-bold tracking-wider text-[#169b62]">
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
              <p className="text-[13px] font-bold tracking-widest text-[#169b62]">HOW IT WORKS</p>

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
                    <span className="text-[14px] font-bold text-[#169b62]">
                      {item.step.split(' ')[1]}
                    </span>
                  </div>

                  <p className="mt-6 text-[12px] font-bold tracking-wider text-[#169b62]">
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
        <section className="bg-[#eaf5ef] px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-[1200px] text-center">
            <h2 className="text-[28px] font-bold text-ems-text sm:text-[36px]">
              새로운 이벤트 경험을 시작해 보세요
            </h2>

            <p className="mt-5 text-[15px] text-[#63758a]">
              SYNC5와 함께 더 많은 가능성을 만나보세요.
            </p>

            <Link
              to={accessToken ? '/mypage' : '/signup'}
              className="mt-8 inline-block rounded-xl bg-ems-primary px-8 py-3.5 text-[14px] font-semibold text-white transition hover:bg-ems-member-primary-hover"
            >
              {accessToken ? '마이페이지로 이동' : '무료로 시작하기'}
            </Link>
          </div>
        </section>

        {/* Team Carousel */}
        <section className="overflow-hidden bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-[1200px] px-6 text-center mb-5">
            <p className="text-[13px] font-bold tracking-widest text-[#169b62]">OUR TEAM</p>

            <h2 className="mt-4 text-[30px] font-bold text-ems-text">SYNC5를 만드는 사람들</h2>

            <p className="mt-4 text-[14px] text-ems-muted">
              다섯 명의 팀원이 함께 만들어가는 이벤트 플랫폼
            </p>
          </div>

          <div
            className="team-carousel mt-12"
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
                    { name: '오좌언', role: '전체 통합', initials: 'OJ' },
                    { name: '하진철', role: 'Member · 인증', initials: 'HJ' },
                    { name: '박천보', role: 'Interaction · 투표', initials: 'PC' },
                    { name: '이도형', role: 'Event · 참가 승인', initials: 'DH' },
                    { name: '이도관', role: 'Event · 행사 관리', initials: 'DG' },
                  ].map((member) => (
                    <article
                      key={member.name}
                      className="flex h-[170px] w-[190px] shrink-0 flex-col items-center justify-center rounded-2xl border border-[#e5e9f0] bg-ems-background p-4 text-center transition-shadow hover:shadow-lg sm:h-[190px] sm:w-[220px] sm:p-5"
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e6f5ee] text-[17px] font-bold text-[#169b62]">
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
      <footer className="bg-[#17253c] px-6 py-14 text-white">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-10 md:grid-cols-[1fr_auto] md:gap-20">
            {/* 브랜드 소개 */}
            <div>
              <Link to="/" className="inline-block text-[28px] font-extrabold tracking-tight">
                SYNC<span className="text-[#22c55e]">5</span>
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
                  to={accessToken ? '/mypage' : '/login'}
                  className="transition-colors hover:text-white"
                >
                  {accessToken ? '마이페이지' : '로그인'}
                </Link>

                {!accessToken && (
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
    </>
  );
};

export default Home;
