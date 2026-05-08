export default function Pagination({
  className = "",
  buttonClassName = "",
  summaryClassName = "",
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  const goToPage = (page) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    if (nextPage !== safePage) onPageChange(nextPage);
  };

  return (
    <nav className={className} aria-label="Pagination">
      <button
        type="button"
        className={buttonClassName}
        onClick={() => goToPage(1)}
        disabled={safePage === 1}
        aria-label="First page"
      >
        First
      </button>
      <button
        type="button"
        className={buttonClassName}
        onClick={() => goToPage(safePage - 1)}
        disabled={safePage === 1}
        aria-label="Previous page"
      >
        Prev
      </button>

      <span className={summaryClassName}>
        {startItem}-{endItem} of {totalItems} | Page {safePage} of {totalPages}
      </span>

      <button
        type="button"
        className={buttonClassName}
        onClick={() => goToPage(safePage + 1)}
        disabled={safePage === totalPages}
        aria-label="Next page"
      >
        Next
      </button>
      <button
        type="button"
        className={buttonClassName}
        onClick={() => goToPage(totalPages)}
        disabled={safePage === totalPages}
        aria-label="Last page"
      >
        Last
      </button>
    </nav>
  );
}
