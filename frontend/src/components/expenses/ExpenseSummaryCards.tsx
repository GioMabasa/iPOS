interface ExpenseSummary {
  total_expenses: number;
  recorded_expenses: number;
  voided_expenses: number;
  expense_transactions: number;
}

interface ExpenseSummaryCardsProps {
  summary: ExpenseSummary;
  loadingSummary: boolean;
  formatAmount: (value: number) => string;
}

export default function ExpenseSummaryCards({
  summary,
  loadingSummary,
  formatAmount,
}: ExpenseSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* Total Expenses */}
      <div className="group relative overflow-hidden rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-indigo-50 transition group-hover:scale-110" />

        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Expenses</p>

            <div className="mt-2">
              {loadingSummary ? (
                <div className="h-8 w-32 animate-pulse rounded-lg bg-gray-100" />
              ) : (
                <p className="text-2xl font-bold tracking-tight text-gray-900">
                  ₱{formatAmount(summary.total_expenses)}
                </p>
              )}
            </div>

            <p className="mt-2 text-xs font-medium text-indigo-600">
              Recorded expenses
            </p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-xl font-bold text-indigo-600">
            ₱
          </div>
        </div>
      </div>

      {/* Recorded Expenses */}
      <div className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-50 transition group-hover:scale-110" />

        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Recorded Expenses
            </p>

            <div className="mt-2">
              {loadingSummary ? (
                <div className="h-8 w-20 animate-pulse rounded-lg bg-gray-100" />
              ) : (
                <p className="text-2xl font-bold tracking-tight text-gray-900">
                  {summary.recorded_expenses.toLocaleString("en-PH")}
                </p>
              )}
            </div>

            <p className="mt-2 text-xs font-medium text-emerald-600">
              Active expense records
            </p>
          </div>

          <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600">
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4"
              />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </div>
        </div>
      </div>

      {/* Voided Expenses */}
      <div className="group relative overflow-hidden rounded-2xl border border-amber-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-50 transition group-hover:scale-110" />

        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Voided Expenses</p>

            <div className="mt-2">
              {loadingSummary ? (
                <div className="h-8 w-32 animate-pulse rounded-lg bg-gray-100" />
              ) : (
                <p className="text-2xl font-bold tracking-tight text-gray-900">
                  ₱{formatAmount(summary.voided_expenses)}
                </p>
              )}
            </div>

            <p className="mt-2 text-xs font-medium text-amber-600">
              Voided transaction value
            </p>
          </div>

          <div className="rounded-xl bg-amber-100 p-3 text-amber-600">
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v4m0 4h.01"
              />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </div>
        </div>
      </div>

      {/* Expense Transactions */}
      <div className="group relative overflow-hidden rounded-2xl border border-purple-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-purple-50 transition group-hover:scale-110" />

        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Expense Transactions
            </p>

            <div className="mt-2">
              {loadingSummary ? (
                <div className="h-8 w-20 animate-pulse rounded-lg bg-gray-100" />
              ) : (
                <p className="text-2xl font-bold tracking-tight text-gray-900">
                  {summary.expense_transactions.toLocaleString("en-PH")}
                </p>
              )}
            </div>

            <p className="mt-2 text-xs font-medium text-purple-600">
              Recorded + voided
            </p>
          </div>

          <div className="rounded-xl bg-purple-100 p-3 text-purple-600">
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 3h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z"
              />
              <path strokeLinecap="round" d="M8 8h8M8 12h8M8 16h5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
