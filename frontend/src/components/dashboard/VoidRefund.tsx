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
        <h2 className="text-lg font-semibold text-gray-900">Void & Refund</h2>

        <p className="mt-1 text-sm text-gray-500">
          Void and refund transactions for the selected period.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {data.length === 0 ? (
          <div className="flex min-h-[180px] items-center justify-center p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">
                No void or refund transactions.
              </p>

              <p className="mt-1 text-xs text-gray-500">
                No void or refund activity was found for this period.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Type
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Sale
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Invoice
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Amount
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Updated
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {data.map((item, index) => {
                  const type = item.action;

                  const amount = item.total;

                  const isVoid = type === "void";

                  return (
                    <tr
                      key={item.sale_id ?? index}
                      className="transition hover:bg-gray-50"
                    >
                      {/* TYPE */}

                      <td className="px-5 py-4">
                        <span
                          className={
                            isVoid
                              ? "inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700"
                              : "inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700"
                          }
                        >
                          {isVoid ? "Void" : "Refund"}
                        </span>
                      </td>

                      {/* SALE */}

                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {item.sale_number ?? "—"}
                        </p>
                      </td>

                      {/* INVOICE */}

                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-700">
                          {item.invoice_number ?? "—"}
                        </p>
                      </td>

                      {/* AMOUNT */}

                      <td className="px-5 py-4 text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(Number(amount))}
                        </p>
                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">
                        <span className="text-sm capitalize text-gray-600">
                          {item.status ?? "—"}
                        </span>
                      </td>

                      {/* UPDATED */}

                      <td className="px-5 py-4 text-right">
                        <span className="text-xs text-gray-500">
                          {formatDate(item.action_date)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
