// 파일 기능: 홈 화면 및 투표 관리·투표 참여 경로를 연결합니다.

import Sidebar from './components/layout/Sidebar.jsx';
import Voting from './pages/voting/Voting.jsx';
import PollManagement from './pages/pollManagement/PollManagement.jsx';
import styles from './pages/voting/Voting.module.scss';

// 함수 역할: 기본 홈 화면을 렌더링합니다.
function Home() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <header className={styles.pageHeader}>
          <div>
            <h1>EMS 이벤트 플랫폼</h1>
            <p>왼쪽 메뉴에서 실시간 투표 또는 투표 관리를 선택해 주세요.</p>
          </div>
        </header>
      </main>
    </div>
  );
}

// 함수 역할: 현재 경로에 맞는 페이지를 선택합니다.
export default function App() {
  // 변수 역할: 현재 화면 선택을 위한 URL 경로
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  if (path === '/polls/vote') return <Voting />;
  if (path === '/polls/manage') return <PollManagement />;
  return <Home />;
}
