import type { Purchase } from "../../types/purchase";

interface PurchaseTableProps {
  purchases: Purchase[];
  loading: boolean;
  search: string;
  total: number;
  from: number | null;
  to: number | null;
  currentPage: number;
  lastPage: number;
  onViewPurchase: (purchase: Purchase) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

function formatCurrency(value: number | string) {
  return Number(value).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function PurchaseTable({
  purchases,
  loading,
  search,
  total,
  from,
  to,
  currentPage,
  lastPage,
  onViewPurchase,
  onPreviousPage,
  onNextPage,
}: PurchaseTableProps) {
  return (
    <>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />

              <span>Loading purchases...</span>
            </div>
          </div>
        ) : (
          <table className="w-full min-w-[900px]">
            <thead className="border-b border-slate-200 bg-slate-50/70">
              <tr>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Purchase #
                </th>

                <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Date
                </th>

                <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Supplier
                </th>

                <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Reference
                </th>

                <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>

                <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Total
                </th>

                <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          className="h-6 w-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 7.5 12 3l9 4.5M4.5 9.75V18L12 21.5 19.5 18V9.75M8 5l8.5 4.25M12 12v9"
                          />
                        </svg>
                      </div>

                      <p className="text-sm font-semibold text-slate-700">
                        {search
                          ? "No purchases match your search."
                          : "No purchases found."}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {search
                          ? "Try a different purchase number, supplier, or reference."
                          : "Received purchases will appear here."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                purchases.map((purchase) => (
                  <tr
                    key={purchase.id}
                    className="group transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            className="h-4 w-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4 6.5 12 3l8 3.5v11L12 21l-8-3.5v-11Z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8 8.5h8M8 12h5"
                            />
                          </svg>
                        </div>

                        <p className="text-sm font-semibold text-slate-900">
                          {purchase.purchase_number}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {new Date(purchase.purchase_date).toLocaleDateString(
                        "en-PH",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-slate-700">
                        {purchase.supplier?.name || "—"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {purchase.reference_number || (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold capitalize text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {purchase.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-bold text-slate-900">
                        ₱{formatCurrency(purchase.total)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => onViewPurchase(purchase)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-3.5 w-3.5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                          />
                          <circle cx="12" cy="12" r="2.5" />
                        </svg>
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {!loading && (
        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            {total > 0
              ? `Showing ${from}–${to} of ${total} purchases`
              : "No purchases"}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPreviousPage}
              disabled={currentPage === 1 || loading}
              className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">
              Page {currentPage} of {lastPage}
            </span>

            <button
              type="button"
              onClick={onNextPage}
              disabled={currentPage === lastPage || loading}
              className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
}
