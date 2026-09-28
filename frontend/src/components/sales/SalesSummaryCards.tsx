interface SalesSummaryCardsProps {
  user: {
    role?: string;
  } | null;

  totalSales: number;
  totalCogs: number;
  grossProfit: number;
  totalExpense: number;
  netProfit: number;
  grossMargin: number;
  cashSales: number;
  chargeSales: number;
  outstandingBalance: number;
  totalTransactions: number;
  totalItemsSold: number;
  totalVoid: number;
  totalRefund: number;
  totalDiscount: number;
  totalTax: number;

  formatCurrency: (value: number) => string;
}

export default function SalesSummaryCards({
  user,
  totalSales,
  totalCogs,
  grossProfit,
  totalExpense,
  netProfit,
  grossMargin,
  cashSales,
  chargeSales,
  outstandingBalance,
  totalTransactions,
  totalItemsSold,
  totalVoid,
  totalRefund,
  totalDiscount,
  totalTax,
  formatCurrency,
}: SalesSummaryCardsProps) {
  const isCashier = user?.role === "cashier";

  return (
    <div className="mb-6 space-y-6">
      {/* =========================================================
          MAIN FINANCIAL SUMMARY
          Admin / Manager Only
      ========================================================= */}
      {!isCashier && (
        <section>
          <div className="mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
              Financial Summary
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Business financial performance for the selected period
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {/* Total Sales */}
            <div className="group rounded-2xl border border-indigo-100 bg-gradient-to-br from-white via-white to-indigo-50/70 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-indigo-600">
                    Total Sales
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                    {formatCurrency(totalSales)}
                  </p>
                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-xl font-bold text-indigo-600 shadow-sm transition group-hover:scale-105">
                  ₱
                </div>
              </div>
            </div>

            {/* Total COGS */}
            <div className="group rounded-2xl border border-sky-100 bg-gradient-to-br from-white via-white to-sky-50/70 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-sky-600">
                    Total COGS
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                    {formatCurrency(totalCogs)}
                  </p>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600 shadow-sm transition group-hover:scale-105">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4 7.5 8 4.5 8-4.5M12 12v9"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Gross Profit */}
            <div className="group rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-white to-emerald-50/70 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-emerald-600">
                    Gross Profit
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600">
                    {formatCurrency(grossProfit)}
                  </p>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 shadow-sm transition group-hover:scale-105">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 17h18"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 14.5 9 10l3 3 7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Expense */}
            <div className="group rounded-2xl border border-orange-100 bg-gradient-to-br from-white via-white to-orange-50/70 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-orange-600">
                    Total Expense
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-orange-600">
                    {formatCurrency(totalExpense)}
                  </p>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 shadow-sm transition group-hover:scale-105">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 3v18M5 7h8a3 3 0 1 1 0 6H8a3 3 0 1 0 0 6h11"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Net Profit */}
            <div className="group rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-white to-emerald-50/70 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-emerald-600">
                    Net Profit
                  </p>
                  <p
                    className={`mt-2 text-2xl font-bold tracking-tight ${
                      netProfit >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {formatCurrency(netProfit)}
                  </p>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 shadow-sm transition group-hover:scale-105">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 19h16"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m6 16 4-4 3 3 5-6"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Gross Margin */}
            <div className="group rounded-2xl border border-violet-100 bg-gradient-to-br from-white via-white to-violet-50/70 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-violet-600">
                    Gross Margin
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-violet-600">
                    {Number(grossMargin).toFixed(2)}%
                  </p>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 shadow-sm transition group-hover:scale-105">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 17 17 7"
                    />
                    <circle cx="7.5" cy="7.5" r="2.5" />
                    <circle cx="16.5" cy="16.5" r="2.5" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================
          SALES & COLLECTION
      ========================================================= */}
      <section>
        <div className="mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
            Sales & Collection
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Sales by payment method and outstanding customer balances
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {/* Cash Sales */}
          <div className="group rounded-2xl border border-teal-100 bg-gradient-to-br from-white via-white to-teal-50/70 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-teal-600">
                  Cash Sales
                </p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                  {formatCurrency(cashSales)}
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-600 shadow-sm transition group-hover:scale-105">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                >
                  <rect x="3" y="6" width="18" height="12" rx="2" />
                  <circle cx="12" cy="12" r="2.5" />
                </svg>
              </div>
            </div>
          </div>

          {/* Charge Sales */}
          <div className="group rounded-2xl border border-orange-100 bg-gradient-to-br from-white via-white to-orange-50/70 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-orange-600">
                  Charge Sales
                </p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                  {formatCurrency(chargeSales)}
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 shadow-sm transition group-hover:scale-105">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 9h10M7 13h5"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Outstanding Balance */}
          <div className="group rounded-2xl border border-amber-100 bg-gradient-to-br from-white via-white to-amber-50/70 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-amber-600">
                  Outstanding Balance
                </p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-amber-600">
                  {formatCurrency(outstandingBalance)}
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 shadow-sm transition group-hover:scale-105">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 7v5l3 2"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          TRANSACTION METRICS
      ========================================================= */}
      <section>
        <div className="mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
            Transaction Metrics
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Sales activity, adjustments, discounts, and tax information
          </p>
        </div>

        <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3`}>
          {/* Total Transactions */}
          <div className="group rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50/70 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-blue-600">
                  Total Transactions
                </p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                  {totalTransactions.toLocaleString()}
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 shadow-sm transition group-hover:scale-105">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 8h8M8 12h8M8 16h5"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Items Sold */}
          <div className="group rounded-2xl border border-cyan-100 bg-gradient-to-br from-white via-white to-cyan-50/70 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-cyan-600">
                  Total Items Sold
                </p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                  {totalItemsSold.toLocaleString()}
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600 shadow-sm transition group-hover:scale-105">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4 7 8-4 8 4-8 4-8-4Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4 12 8 4 8-4M4 17l8 4 8-4"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Void - Admin / Manager Only */}
          {!isCashier && (
            <div className="group rounded-2xl border border-rose-100 bg-gradient-to-br from-white via-white to-rose-50/70 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-rose-600">
                    Total Void
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-rose-600">
                    {totalVoid.toLocaleString()}
                  </p>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 shadow-sm transition group-hover:scale-105">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m9 9 6 6M15 9l-6 6"
                    />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Total Refund - Admin / Manager Only */}
          {!isCashier && (
            <div className="group rounded-2xl border border-amber-100 bg-gradient-to-br from-white via-white to-yellow-50/70 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-amber-600">
                    Total Refund
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-amber-600">
                    {totalRefund.toLocaleString()}
                  </p>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 shadow-sm transition group-hover:scale-105">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20 12a8 8 0 1 1-2.34-5.66"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20 5v5h-5"
                    />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Total Discount */}
          <div className="group rounded-2xl border border-fuchsia-100 bg-gradient-to-br from-white via-white to-fuchsia-50/70 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-fuchsia-200 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-fuchsia-600">
                  Total Discount
                </p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-fuchsia-600">
                  {formatCurrency(totalDiscount)}
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fuchsia-100 text-fuchsia-600 shadow-sm transition group-hover:scale-105">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m7 7 10 10"
                  />
                  <circle cx="7.5" cy="7.5" r="2.5" />
                  <circle cx="16.5" cy="16.5" r="2.5" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Tax - Admin / Manager Only */}
          {!isCashier && (
            <div className="group rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-600">
                    Total Tax
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                    {formatCurrency(totalTax)}
                  </p>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 shadow-sm transition group-hover:scale-105">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 9h8M8 13h3M14 13h2M8 17h2M13 17h3"
                    />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
