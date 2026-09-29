import type { Expense } from "../../types/expense";

interface ExpenseViewModalProps {
  expense: Expense | null;
  loadingDetails: boolean;
  formatAmount: (value: number | string) => string;
  formatDate: (value: string) => string;
  onClose: () => void;
}

export default function ExpenseViewModal({
  expense,
  loadingDetails,
  formatAmount,
  formatDate,
  onClose,
}: ExpenseViewModalProps) {
  if (!expense) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/45 p-3 backdrop-blur-[2px] sm:p-4">
      <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100vh-2rem)] sm:rounded-3xl">
        {/* Header */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 px-4 py-4 text-white sm:px-5 sm:py-5">
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 sm:h-32 sm:w-32" />
          <div className="absolute -bottom-12 -left-8 h-24 w-24 rounded-full bg-white/5 sm:h-28 sm:w-28" />

          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1.5 flex items-center gap-2 sm:mb-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20 sm:h-9 sm:w-9 sm:rounded-xl">
                  <svg
                    className="h-4 w-4 sm:h-5 sm:w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.05 1.852-2.248A48.424 48.424 0 0112 2.25c2.005 0 3.968.125 5.852.358C18.899 2.558 19.5 3.5 19.5 4.757z"
                    />
                  </svg>
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold tracking-tight sm:text-xl">
                    Expense Details
                  </h2>

                  <p className="mt-0.5 truncate text-xs text-indigo-100 sm:mt-1 sm:text-sm">
                    {expense.reference_no
                      ? `Reference No. ${expense.reference_no}`
                      : `Expense #${expense.id}`}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg bg-white/10 p-1.5 text-white transition hover:bg-white/20 sm:rounded-xl sm:p-2"
            >
              <svg
                className="h-4 w-4 sm:h-5 sm:w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>

        {loadingDetails ? (
          <div className="flex min-h-0 flex-1 items-center justify-center px-5 py-10">
            <div className="text-center">
              <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-indigo-100 border-t-indigo-600" />
              <p className="text-sm font-medium text-slate-500">
                Loading details...
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Scrollable Content */}
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
              <div className="space-y-3.5 sm:space-y-5">
                {/* Status */}
                <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
                      Status
                    </p>

                    <p className="mt-0.5 truncate text-xs font-semibold text-slate-700 sm:text-sm">
                      Transaction Status
                    </p>
                  </div>

                  {expense.status === "Voided" ? (
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700 ring-1 ring-red-200 sm:px-3 sm:py-1.5 sm:text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      Voided
                    </span>
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200 sm:px-3 sm:py-1.5 sm:text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Recorded
                    </span>
                  )}
                </div>

                {/* Date & Category */}
                <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-4">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
                      Date
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-800 sm:mt-1.5 sm:text-sm">
                      {formatDate(expense.expense_date)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-4">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
                      Category
                    </p>

                    <p className="mt-1 truncate text-xs font-semibold text-slate-800 sm:mt-1.5 sm:text-sm">
                      {expense.category?.name || "—"}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 sm:rounded-2xl sm:p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-500 sm:text-xs">
                    Description
                  </p>

                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-800 sm:mt-1.5 sm:text-sm sm:leading-6">
                    {expense.description}
                  </p>
                </div>

                {/* Amount & Payment */}
                <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 sm:rounded-2xl sm:p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 sm:text-xs">
                      Amount
                    </p>

                    <p className="mt-1 text-lg font-extrabold tracking-tight text-emerald-700 sm:text-xl">
                      ₱{formatAmount(expense.amount)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-violet-100 bg-violet-50 p-3 sm:rounded-2xl sm:p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-600 sm:text-xs">
                      Payment Method
                    </p>

                    <p className="mt-1 truncate text-xs font-bold text-violet-700 sm:mt-1.5 sm:text-sm">
                      {expense.payment_method}
                    </p>
                  </div>
                </div>

                {/* Notes */}
                {expense.notes && (
                  <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3 sm:rounded-2xl sm:p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 sm:text-xs">
                      Notes
                    </p>

                    <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-slate-700 sm:mt-1.5 sm:text-sm sm:leading-6">
                      {expense.notes}
                    </p>
                  </div>
                )}

                {/* Created By */}
                <div className="flex items-center gap-3 border-t border-slate-100 pt-3 sm:pt-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 sm:h-9 sm:w-9">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                      />
                    </svg>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
                      Created By
                    </p>

                    <p className="mt-0.5 truncate text-xs font-semibold text-slate-800 sm:text-sm">
                      {expense.creator?.name || "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex shrink-0 justify-end border-t border-slate-200 bg-slate-50/80 px-4 py-3 sm:px-5 sm:py-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 active:scale-[0.98] sm:px-5 sm:py-2.5 sm:text-sm"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
