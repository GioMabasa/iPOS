interface SalesPaginationProps {
  page: number;
  lastPage: number;
  totalTransactions: number;
  from: number;
  to: number;
  onPageChange: (page: number) => void;
}

export default function SalesPagination({
  page,
  lastPage,
  totalTransactions,
  from,
  to,
  onPageChange,
}: SalesPaginationProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-sm text-slate-500">
        {totalTransactions > 0 ? (
          <>
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {from}–{to}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">
              {totalTransactions}
            </span>{" "}
            transactions
          </>
        ) : (
          "No transactions"
        )}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m15 18-6-6 6-6"
            />
          </svg>

          <span className="hidden sm:inline">Previous</span>
        </button>

        <span className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">
          Page <span className="font-semibold text-slate-900">{page}</span> of{" "}
          <span className="font-semibold text-slate-900">{lastPage}</span>
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === lastPage}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="hidden sm:inline">Next</span>

          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m9 18 6-6-6-6"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
