import { useState } from "react";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="flex items-center justify-center gap-1 px-4 py-3 border-t border-line">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1.5 text-xs font-medium rounded-lg text-muted hover:bg-mist disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
      >
        Anterior
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="px-2 text-xs text-muted">...</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-colors duration-200 ${
              p === currentPage
                ? "bg-primary text-paper shadow-sm"
                : "text-muted hover:bg-mist"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1.5 text-xs font-medium rounded-lg text-muted hover:bg-mist disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
      >
        Siguiente
      </button>
    </div>
  );
}

export function usePagination(items, pageSize = 5) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(items.length / pageSize);
  const paginatedItems = items.slice((page - 1) * pageSize, page * pageSize);

  return { page, totalPages, paginatedItems, setPage };
}
