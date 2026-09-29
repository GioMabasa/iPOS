import type { Expense } from "../../types/expense";

interface ExpenseTableProps {
  expenses: Expense[];
  loading: boolean;
  total: number;
  from: number | null;
  to: number | null;
  currentPage: number;
  lastPage: number;
  formatAmount: (amount: string | number) => string;
  formatDate: (date: string) => string;
  onView: (expense: Expense) => void;
  onEdit: (expense: Expense) => void;
  onVoid: (expense: Expense) => void;
  onPageChange: (page: number) => void;
}

export default function ExpenseTable({
  expenses,
  loading,
  total,
  from,
  to,
  currentPage,
  lastPage,
  formatAmount,
  formatDate,
  onView,
  onEdit,
  onVoid,
  onPageChange,
}: ExpenseTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 sm:px-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Expense Records
          </h3>

          <p className="mt-0.5 text-xs text-gray-500">
            {total === 0
              ? "No expense records found."
              : `Showing ${from ?? 0}-${to ?? 0} of ${total} records`}
          </p>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center px-5 py-12">
          <div className="text-center">
            <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-indigo-100 border-t-indigo-600" />

            <p className="text-sm font-medium text-gray-500">
              Loading expenses...
            </p>
          </div>
        </div>
      ) : expenses.length === 0 ? (
        /* Empty */
        <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75 1.5-3.75-1.5V4.757c0-1.108.806-2.05 1.852-2.248A48.424 48.424 0 0112 2.25c2.005 0 3.968.125 5.852.358C18.899 2.558 19.5 3.5 19.5 4.757z"
              />
            </svg>
          </div>

          <p className="text-sm font-semibold text-gray-700">
            No expenses found
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Try adjusting your filters or add a new expense.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Date
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Category
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Description
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Payment
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Amount
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {expenses.map((expense) => (
                  <tr
                    key={expense.id}
                    onClick={() => onView(expense)}
                    className="cursor-pointer transition hover:bg-indigo-50/40"
                    title="Click to view expense details"
                  >
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                      {formatDate(expense.expense_date)}
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-gray-800">
                        {expense.category?.name || "—"}
                      </span>
                    </td>

                    <td className="max-w-xs px-5 py-4">
                      <div className="truncate text-sm font-medium text-gray-900">
                        {expense.description}
                      </div>

                      {expense.reference_no && (
                        <div className="mt-0.5 truncate text-xs text-gray-500">
                          Ref: {expense.reference_no}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-600">
                      {expense.payment_method}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-gray-900">
                      ₱{formatAmount(expense.amount)}
                    </td>

                    <td className="px-5 py-4 text-center">
                      {expense.status === "Voided" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                          Voided
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Recorded
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div
                        className="flex justify-end gap-2"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => onEdit(expense)}
                          disabled={expense.status === "Voided"}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Edit
                        </button>

                        {expense.status !== "Voided" && (
                          <button
                            type="button"
                            onClick={() => onVoid(expense)}
                            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            Void
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="divide-y divide-gray-100 md:hidden">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                onClick={() => onView(expense)}
                className="cursor-pointer p-4 transition active:bg-indigo-50/60"
                title="Tap to view expense details"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {expense.description}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {formatDate(expense.expense_date)} •{" "}
                      {expense.category?.name || "—"}
                    </p>
                  </div>

                  {expense.status === "Voided" ? (
                    <span className="shrink-0 rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700 ring-1 ring-red-200">
                      Voided
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                      Recorded
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-500">
                      {expense.payment_method}
                    </p>

                    <p className="mt-0.5 text-sm font-bold text-gray-900">
                      ₱{formatAmount(expense.amount)}
                    </p>
                  </div>

                  <div
                    className="flex gap-2"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => onEdit(expense)}
                      disabled={expense.status === "Voided"}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Edit
                    </button>

                    {expense.status !== "Voided" && (
                      <button
                        type="button"
                        onClick={() => onVoid(expense)}
                        className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Void
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50/60 px-4 py-3 sm:px-5">
              <p className="text-xs text-gray-500">
                Page {currentPage} of {lastPage}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage >= lastPage}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
