// 분리된 투표 참여 상태 및 실시간 통신 Hook을 조합하는 화면 진입점.
import { useVotePage } from '../hooks/vote/useVotePage.js';
import VotePollList from '../components/vote/VotePollList.jsx';
import VotePollDetail from '../components/vote/VotePollDetail.jsx';

// 공통 레이아웃 SCSS 모듈의 클래스명을 실제 CSS 클래스명으로 변환한다.
import { mapClassNames } from '../../../styles/classNames.js';
import module0 from '../../../components/layout/header.module.scss';
// cx(value): SCSS 모듈에 정의된 클래스명을 조회하는 편의 함수.
const cx = (value) => mapClassNames(value, module0);
import Header from '../../../components/layout/Header.jsx';

/**
 * VotePage: 승인된 사용자의 투표 목록, 참여, 결과 조회 및 실시간 알림을 관리하는 화면.
 * REST API 호출은 pollApi, 실시간 메시지 연결은 connectPollSocket에 위임한다.
 * (직접 호출 위치는 useVotePage/useVoteRealtime Hook으로 이동했다.)
 */
export default function VotePage() {
  const {
    polls,
    selectedId,
    setSelectedId,
    optionId,
    setOptionId,
    results,
    error,
    notice,
    busy,
    socketConnected,
    poll,
    submitted,
    canViewResults,
    submit,
    showResults,
  } = useVotePage();

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
          <VotePollList polls={polls} selectedId={selectedId} setSelectedId={setSelectedId} />
          <VotePollDetail
            poll={poll}
            submitted={submitted}
            optionId={optionId}
            setOptionId={setOptionId}
            busy={busy}
            canViewResults={canViewResults}
            submit={submit}
            showResults={showResults}
            results={results}
          />
        </div>
      </main>
    </div>
  );
}
