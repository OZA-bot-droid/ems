import { useAuth } from '../../../member/hooks/useAuth.js';
import styles from '../../styles/PollHeader.module.scss';

export default function PollResultHeader() {
  const { role } = useAuth();

  return (
    <header className={styles.pollPageHeader}>
      <div>
        <h1>투표 결과</h1>
        <p>행사·세션의 투표 결과를 조회합니다.</p>
      </div>

      {(role === 'ADMIN' || role === 'USER') && (
        <span
          className={`${styles.pollPageRole} ${
            role === 'ADMIN' ? styles.pollPageRoleAdmin : styles.pollPageRoleUser
          }`}
        >
          {role}
        </span>
      )}
    </header>
  );
}
