import type { InventorySummary } from "../../types/report";

interface InventoryMovementProps {
  inventory: InventorySummary;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-PH").format(Number(value) || 0);
}

export default function InventoryMovement({
  inventory,
}: InventoryMovementProps) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          Inventory Movement
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Stock movement for the selected period.
        </p>
      </div>

      {/* ==========================================================
          SUMMARY CARD
      ========================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* ========================================================
            HEADER
        ======================================================== */}

        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Stock Activity
            </p>

            <p className="mt-0.5 text-xs text-slate-400">
              Inventory movement summary
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10" />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m13 3 4 4-4 4"
              />

              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17H7" />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m11 21-4-4 4-4"
              />
            </svg>
          </div>
        </div>

        {/* ========================================================
            CONTENT
        ======================================================== */}

        <div className="p-5">
          {/* ======================================================
              PRIMARY MOVEMENT
          ====================================================== */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* STOCK IN */}

            <div className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
              <div className="absolute -right-7 -top-7 h-20 w-20 rounded-full bg-emerald-100/60 transition duration-300 group-hover:scale-110" />

              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                    Stock In
                  </p>

                  <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                    {formatNumber(inventory.total_in)}
                  </p>

                  <p className="mt-1 text-xs font-medium text-emerald-600">
                    Items received
                  </p>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm transition duration-200 group-hover:scale-105 group-hover:bg-emerald-700">
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
                      d="M12 19V5"
                    />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m6 11 6-6 6 6"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* STOCK OUT */}

            <div className="group relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
              <div className="absolute -right-7 -top-7 h-20 w-20 rounded-full bg-blue-100/60 transition duration-300 group-hover:scale-110" />

              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                    Stock Out
                  </p>

                  <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                    {formatNumber(inventory.total_out)}
                  </p>

                  <p className="mt-1 text-xs font-medium text-blue-600">
                    Items released
                  </p>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition duration-200 group-hover:scale-105 group-hover:bg-blue-700">
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
                      d="M12 5v14"
                    />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m18 13-6 6-6-6"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* NET MOVEMENT */}

            <div className="group relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
              <div className="absolute -right-7 -top-7 h-20 w-20 rounded-full bg-indigo-100/60 transition duration-300 group-hover:scale-110" />

              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                    Net Movement
                  </p>

                  <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                    {formatNumber(inventory.net_movement)}
                  </p>

                  <p className="mt-1 text-xs font-medium text-indigo-600">
                    Net inventory movement
                  </p>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm transition duration-200 group-hover:scale-105 group-hover:bg-indigo-700">
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
                      d="M5 12h14"
                    />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m13 6 6 6-6 6"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* REFUNDS */}

            <div className="group relative overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md">
              <div className="absolute -right-7 -top-7 h-20 w-20 rounded-full bg-amber-100/60 transition duration-300 group-hover:scale-110" />

              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                    Refunds
                  </p>

                  <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                    {formatNumber(inventory.refunds)}
                  </p>

                  <p className="mt-1 text-xs font-medium text-amber-600">
                    Items returned
                  </p>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm transition duration-200 group-hover:scale-105 group-hover:bg-amber-600">
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
                      d="M9 7H5v4"
                    />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 11a7 7 0 1 0 2-5"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================
              MOVEMENT DETAILS
          ====================================================== */}

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50">
            <div className="border-b border-slate-100 bg-white px-4 py-3">
              <p className="text-sm font-semibold text-slate-800">
                Movement Details
              </p>

              <p className="mt-0.5 text-xs text-slate-400">
                Breakdown of inventory transactions
              </p>
            </div>

            <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
              {/* PURCHASES */}

              <div className="group bg-white px-4 py-4 transition hover:bg-emerald-50/50">
                <p className="text-xs font-medium text-slate-400">Purchases</p>

                <p className="mt-1 text-sm font-bold text-emerald-600">
                  {formatNumber(inventory.purchases)}
                </p>
              </div>

              {/* SALES */}

              <div className="group bg-white px-4 py-4 transition hover:bg-blue-50/50">
                <p className="text-xs font-medium text-slate-400">Sales</p>

                <p className="mt-1 text-sm font-bold text-blue-600">
                  {formatNumber(inventory.sales)}
                </p>
              </div>

              {/* REFUNDS */}

              <div className="group bg-white px-4 py-4 transition hover:bg-amber-50/50">
                <p className="text-xs font-medium text-slate-400">Refunds</p>

                <p className="mt-1 text-sm font-bold text-amber-600">
                  {formatNumber(inventory.refunds)}
                </p>
              </div>

              {/* VOIDS */}

              <div className="group bg-white px-4 py-4 transition hover:bg-rose-50/50">
                <p className="text-xs font-medium text-slate-400">Voids</p>

                <p className="mt-1 text-sm font-bold text-rose-600">
                  {formatNumber(inventory.voids)}
                </p>
              </div>

              {/* BAD ORDERS */}

              <div className="group bg-white px-4 py-4 transition hover:bg-orange-50/50">
                <p className="text-xs font-medium text-slate-400">Bad Orders</p>

                <p className="mt-1 text-sm font-bold text-orange-600">
                  {formatNumber(inventory.bad_orders)}
                </p>
              </div>

              {/* ADJUSTMENT IN */}

              <div className="group bg-white px-4 py-4 transition hover:bg-indigo-50/50">
                <p className="text-xs font-medium text-slate-400">
                  Adjustment In
                </p>

                <p className="mt-1 text-sm font-bold text-indigo-600">
                  {formatNumber(inventory.adjustment_in)}
                </p>
              </div>

              {/* ADJUSTMENT OUT */}

              <div className="group bg-white px-4 py-4 transition hover:bg-violet-50/50">
                <p className="text-xs font-medium text-slate-400">
                  Adjustment Out
                </p>

                <p className="mt-1 text-sm font-bold text-violet-600">
                  {formatNumber(inventory.adjustment_out)}
                </p>
              </div>

              {/* TRANSACTIONS */}

              <div className="group bg-white px-4 py-4 transition hover:bg-cyan-50/50">
                <p className="text-xs font-medium text-slate-400">
                  Transactions
                </p>

                <p className="mt-1 text-sm font-bold text-cyan-600">
                  {formatNumber(inventory.transaction_count)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
