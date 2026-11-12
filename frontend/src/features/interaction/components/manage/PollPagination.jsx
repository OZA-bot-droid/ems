import styles from '../../styles/PollManage.module.scss';

// 목록의 0부터 시작하는 page를 페이지 번호 및 이동 버튼으로 변경
export default function PollPagination({ page, pages, onPageChange }) {
  // 전체 페이지가 2개 미만이면 페이징 표시하지 않음
  if (pages <= 1) return null;

  // 페이지 번호를 최대 5개씩 표시
  const groupSize = 5;
  const start = Math.floor(page / groupSize) * groupSize;
  const end = Math.min(start + groupSize, pages);

  const pageNumbers = Array.from({ length: end - start }, (_, index) => start + index);

  // 페이지 범위를 벗어나지 않도록 처리
  const movePage = (targetPage) => {
    if (targetPage < 0 || targetPage >= pages) return;
    if (targetPage === page) return;

    onPageChange(targetPage);
  };

  return (
    <nav className={styles.pagination} aria-label="투표 관리 페이지 이동">
      {/* 첫 페이지 */}
      <button
        type="button"
        className={styles.pageButton}
        disabled={page === 0}
        onClick={() => movePage(0)}
        aria-label="첫 페이지"
      >
        «
      </button>

      {/* 이전 페이지 */}
      <button
        type="button"
        className={styles.pageButton}
        disabled={page === 0}
        onClick={() => movePage(page - 1)}
        aria-label="이전 페이지"
      >
        ‹
      </button>

      {/* 페이지 번호 */}
      {pageNumbers.map((pageNumber) => (
        <button
          key={pageNumber}
          type="button"
          className={`${styles.pageButton} ${page === pageNumber ? styles.activePage : ''}`}
          aria-current={page === pageNumber ? 'page' : undefined}
          onClick={() => movePage(pageNumber)}
        >
          {pageNumber + 1}
        </button>
      ))}

      {/* 다음 페이지 */}
      <button
        type="button"
        className={styles.pageButton}
        disabled={page + 1 >= pages}
        onClick={() => movePage(page + 1)}
        aria-label="다음 페이지"
      >
        ›
      </button>

      {/* 마지막 페이지 */}
      <button
        type="button"
        className={styles.pageButton}
        disabled={page + 1 >= pages}
        onClick={() => movePage(pages - 1)}
        aria-label="마지막 페이지"
      >
        »
      </button>
    </nav>
  );
}
