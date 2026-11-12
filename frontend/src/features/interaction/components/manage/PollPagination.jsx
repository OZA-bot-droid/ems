// 목록의 0부터 시작하는 page를 이전/다음 버튼으로 이동
export default function PollPagination({ page, pages, onPageChange }) {
  return (
    <>
      {/* 전체 페이지가 2개 이상일 때만 이전/다음 버튼 표시 */}
      {pages > 1 && (
        <div className="mt-4 flex gap-3">
          <button disabled={page === 0} onClick={() => onPageChange((v) => v - 1)}>
            이전
          </button>
          <span>
            {page + 1}/{pages}
          </span>
          <button disabled={page + 1 >= pages} onClick={() => onPageChange((v) => v + 1)}>
            다음
          </button>
        </div>
      )}
    </>
  );
}
