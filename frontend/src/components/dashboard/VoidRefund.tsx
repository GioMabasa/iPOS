import type { VoidRefund as VoidRefundItem } from "../../types/report";

interface VoidRefundProps {
  data: VoidRefundItem[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value?: string): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function VoidRefund({ data }: VoidRefundProps) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          Void & Refund
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Void and refund transactions for the selected period.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* ==========================================================
            HEADER
        ========================================================== */}

        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Transaction Activity
            </p>

            <p className="mt-0.5 text-xs text-slate-400">
              Recent void and refund transactions
            </p>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 7H5v4" />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 11a7 7 0 1 0 2-5"
              />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h4v-4"
              />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 13a7 7 0 1 0-2 5"
              />
            </svg>
          </div>
        </div>

        {/* ==========================================================
            CONTENT
        ========================================================== */}

        <div className="max-h-[520px] overflow-y-auto">
          {data.length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m5 12 4 4L19 6"
                  />
                </svg>
              </div>

              <p className="mt-4 text-sm font-semibold text-slate-700">
                No void or refund transactions.
              </p>

              <p className="mt-1 text-xs text-slate-400">
                No void or refund activity was found for this period.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.map((item, index) => {
                const type = item.action;

                const amount = item.total;

                const isVoid = type === "void";

                return (
                  <div
                    key={item.sale_id ?? index}
                    className="group p-5 transition hover:bg-slate-50/70"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      {/* ==================================================
                          TRANSACTION
                      ================================================== */}

                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className={
                            isVoid
                              ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600"
                              : "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600"
                          }
                        >
                          {isVoid ? (
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
                                d="M6 6l12 12"
                              />

                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M18 6 6 18"
                              />
                            </svg>
                          ) : (
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

                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 11h4"
                              />
                            </svg>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {item.sale_number ?? "—"}
                            </p>

                            <span
                              className={
                                isVoid
                                  ? "inline-flex rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600"
                                  : "inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-600"
                              }
                            >
                              {isVoid ? "Void" : "Refund"}
                            </span>
                          </div>

                          <p className="mt-1 truncate text-xs text-slate-400">
                            Invoice: {item.invoice_number ?? "—"}
                          </p>
                        </div>
                      </div>

                      {/* ==================================================
                          AMOUNT + STATUS
                      ================================================== */}

                      <div className="flex flex-wrap items-center gap-6 lg:shrink-0">
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                            Amount
                          </p>

                          <p className="mt-1 text-sm font-bold text-slate-900">
                            {formatCurrency(Number(amount))}
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                            Status
                          </p>

                          <p className="mt-1 text-sm font-semibold capitalize text-slate-700">
                            {item.status ?? "—"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                            Updated
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {formatDate(item.action_date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
