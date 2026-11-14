import { Link } from 'react-router-dom';
import { btn } from './pollManageStyles.js';
import styles from '../../styles/PollHeader.module.scss';

// 관리자 페이지 헤더: 생성 폼 토글과 세션 관리 이동
export default function PollManageHeader() {
  return (
    <header className={styles.pollPageHeader}>
      <div>
        <h1>투표 관리</h1>
        <p>행사·세션별 투표를 생성하고 활성화·종료합니다.</p>
      </div>

      <span className={`${styles.pollPageRole} ${styles.pollPageRoleAdmin}`}>ADMIN</span>
    </header>
  );
}
