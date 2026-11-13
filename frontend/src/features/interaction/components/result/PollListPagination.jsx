/** Spring PageResponse의 0-based page, totalPages 기반 페이지 이동 */
export default function PollListPagination({ page, pages, totalElements, loading, onPageChange }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="투표 목록 페이지 이동" className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-500">
        총 {totalElements}개 · {page + 1}/{pages} 페이지
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-lg border px-3 py-2 text-sm"
          disabled={loading || page <= 0}
          onClick={() => onPageChange((value) => Math.max(0, value - 1))}
        >
          이전
        </button>
        <button
          type="button"
          className="rounded-lg border px-3 py-2 text-sm"
          disabled={loading || page + 1 >= pages}
          onClick={() => onPageChange((value) => Math.min(pages - 1, value + 1))}
        >
          다음
        </button>
      </div>
    </nav>
  );
}
