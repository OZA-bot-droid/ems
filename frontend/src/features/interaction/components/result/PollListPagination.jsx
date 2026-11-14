import styles from '../../styles/PollList.module.scss';

/** Spring PageResponse의 0-based page, totalPages 기반 페이지 이동 */
export default function PollListPagination({ page, pages, totalElements, loading, onPageChange }) {
  // 전체 페이지가 2개 이상일 때만 표시
  if (pages <= 1) return null;

  // 페이지 번호를 최대 5개씩 표시
  const groupSize = 5;
  const start = Math.floor(page / groupSize) * groupSize;
  const end = Math.min(start + groupSize, pages);

  const pageNumbers = Array.from({ length: end - start }, (_, index) => start + index);

  // 0-based 페이지 범위 검증
  const movePage = (targetPage) => {
    if (loading) return;
    if (targetPage < 0 || targetPage >= pages) return;
    if (targetPage === page) return;

    onPageChange(targetPage);
  };

  return (
    <nav aria-label="투표 목록 페이지 이동" className={styles.pagination}>
      {/* 첫 페이지 */}
      <button
        type="button"
        className={styles.pageButton}
        disabled={loading || page === 0}
        onClick={() => movePage(0)}
        aria-label="첫 페이지"
      >
        «
      </button>

      {/* 이전 페이지 */}
      <button
        type="button"
        className={styles.pageButton}
        disabled={loading || page === 0}
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
          disabled={loading}
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
        disabled={loading || page + 1 >= pages}
        onClick={() => movePage(page + 1)}
        aria-label="다음 페이지"
      >
        ›
      </button>

      {/* 마지막 페이지 */}
      <button
        type="button"
        className={styles.pageButton}
        disabled={loading || page + 1 >= pages}
        onClick={() => movePage(pages - 1)}
        aria-label="마지막 페이지"
      >
        »
      </button>

      <span className={styles.pageInfo}>
        총 {totalElements}개 · {page + 1}/{pages} 페이지
      </span>
    </nav>
  );
}
