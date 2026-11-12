import { Link } from 'react-router-dom';
import { btn } from './pollManageStyles.js';

// 관리자 페이지 헤더: 생성 폼 토글과 세션 관리 이동
export default function PollManageHeader({ onCreateClick }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">투표 관리</h1>
        <p className="text-sm text-slate-500">행사·세션별 투표를 생성하고 활성화·종료합니다.</p>
      </div>
      <div className="flex gap-1">
        <button className={btn} onClick={onCreateClick}>
          ＋ 새 투표
        </button>
      </div>
    </header>
  );
}
