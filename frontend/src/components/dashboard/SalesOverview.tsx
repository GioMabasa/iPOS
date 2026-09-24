import type { SalesSummary } from "../../types/report";
import { useAuth } from "../../context/AuthContext";

interface SalesOverviewProps {
  sales: SalesSummary;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-PH").format(Number(value) || 0);
}

export default function SalesOverview({ sales }: SalesOverviewProps) {
  const { user } = useAuth();

  const isCashier = user?.role === "cashier";

  return (
    <section>
      {/* SECTION HEADER */}

      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          Sales Overview
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Sales performance for the selected period.
        </p>
      </div>

      {/* SALES CARDS */}

      <div
        className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${
          isCashier ? "xl:grid-cols-2" : "xl:grid-cols-4"
        }`}
      >
        {/* ======================================================
            TOTAL SALES
        ====================================================== */}

        <div className="group relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-indigo-100/60 transition duration-300 group-hover:scale-110" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-indigo-700">
                Total Sales
              </p>

              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {formatCurrency(sales.total_sales)}
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm transition duration-200 group-hover:scale-105 group-hover:bg-indigo-700">
              <div
                className="text-lg font-bold leading-none"
                aria-hidden="true"
              >
                ₱
              </div>
            </div>
          </div>

          <div className="relative mt-4 border-t border-indigo-100 pt-3">
            <p className="text-xs font-medium text-indigo-600">
              Revenue generated
            </p>
          </div>
        </div>

        {/* ======================================================
            TRANSACTIONS
        ====================================================== */}

        <div className="group relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-100/60 transition duration-300 group-hover:scale-110" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-blue-700">
                Transactions
              </p>

              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {formatNumber(sales.transaction_count)}
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition duration-200 group-hover:scale-105 group-hover:bg-blue-700">
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
                  d="M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7h8M8 11h8M8 15h5"
                />
              </svg>
            </div>
          </div>

          <div className="relative mt-4 border-t border-blue-100 pt-3">
            <p className="text-xs font-medium text-blue-600">Completed sales</p>
          </div>
        </div>

        {/* ======================================================
            GROSS PROFIT
        ====================================================== */}

        {!isCashier && (
          <div className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-100/60 transition duration-300 group-hover:scale-110" />

            <div className="relative flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-emerald-700">
                  Gross Profit
                </p>

                <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-700">
                  {formatCurrency(sales.gross_profit)}
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm transition duration-200 group-hover:scale-105 group-hover:bg-emerald-700">
                <div
                  className="text-lg font-bold leading-none"
                  aria-hidden="true"
                >
                  ₱
                </div>
              </div>
            </div>

            <div className="relative mt-4 border-t border-emerald-100 pt-3">
              <p className="text-xs font-medium text-emerald-600">
                Sales minus COGS
              </p>
            </div>
          </div>
        )}

        {/* ======================================================
            GROSS MARGIN
        ====================================================== */}

        {!isCashier && (
          <div className="group relative overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-100/60 transition duration-300 group-hover:scale-110" />

            <div className="relative flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-violet-700">
                  Gross Margin
                </p>

                <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                  {Number(sales.gross_margin).toFixed(2)}%
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm transition duration-200 group-hover:scale-105 group-hover:bg-violet-700">
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
                    d="M4 19V9"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 19V5"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 19v-7"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M22 19H2"
                  />
                </svg>
              </div>
            </div>

            <div className="relative mt-4 border-t border-violet-100 pt-3">
              <p className="text-xs font-medium text-violet-600">
                Gross profit percentage
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
