import { useEffect, useMemo, useState } from "react";

import type { SaleActionRequest } from "../../types/saleActionRequest";

interface MyRequestsCashierOnlyProps {
  myActionRequests: SaleActionRequest[];

  getRequestActionClass: (actionType: string) => string;
  getRequestActionLabel: (actionType: string) => string;

  formatCurrency: (value: number) => string;

  getRequestStatusClass: (status: string) => string;
  getRequestStatusLabel: (status: string) => string;

  formatDate: (value: string) => string;

  onClose: () => void;
}

export default function MyRequestsCashierOnly({
  myActionRequests,
  getRequestActionClass,
  getRequestActionLabel,
  formatCurrency,
  getRequestStatusClass,
  getRequestStatusLabel,
  formatDate,
  onClose,
}: MyRequestsCashierOnlyProps) {
  const [requestStatusFilter, setRequestStatusFilter] = useState("all");
  const [requestTypeFilter, setRequestTypeFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);

  const requestsPerPage = 10;

  const filteredRequests = useMemo(() => {
    return myActionRequests.filter((request) => {
      const matchesStatus =
        requestStatusFilter === "all" || request.status === requestStatusFilter;

      const matchesType =
        requestTypeFilter === "all" ||
        request.action_type === requestTypeFilter;

      return matchesStatus && matchesType;
    });
  }, [myActionRequests, requestStatusFilter, requestTypeFilter]);

  const total = filteredRequests.length;

  const lastPage = Math.max(1, Math.ceil(total / requestsPerPage));

  const from = total === 0 ? 0 : (currentPage - 1) * requestsPerPage + 1;

  const to = total === 0 ? 0 : Math.min(currentPage * requestsPerPage, total);

  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * requestsPerPage;
    const endIndex = startIndex + requestsPerPage;

    return filteredRequests.slice(startIndex, endIndex);
  }, [filteredRequests, currentPage]);

  useEffect(() => {
    if (currentPage > lastPage) {
      setCurrentPage(lastPage);
    }
  }, [currentPage, lastPage]);

  const goToPage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), lastPage);
    setCurrentPage(nextPage);
  };

  const clearRequestFilters = () => {
    setRequestStatusFilter("all");
    setRequestTypeFilter("all");
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setRequestStatusFilter(value);
    setCurrentPage(1);
  };

  const handleTypeFilterChange = (value: string) => {
    setRequestTypeFilter(value);
    setCurrentPage(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* My Requests - Cashier Only */}
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
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
                  d="M8 7h8M8 11h5"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
                />
              </svg>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                My Requests
              </h2>

              <p className="mt-0.5 text-xs text-slate-400">
                Track your Void and Refund approval requests.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
            >
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
                  d="m6 6 12 12M18 6 6 18"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Status Filter */}
              <select
                value={requestStatusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="all">All Requests</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              {/* Type Filter */}
              <select
                value={requestTypeFilter}
                onChange={(e) => handleTypeFilterChange(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="all">All Types</option>
                <option value="void">Void</option>
                <option value="refund">Refund</option>
              </select>
            </div>

            {(requestStatusFilter !== "all" || requestTypeFilter !== "all") && (
              <button
                type="button"
                onClick={clearRequestFilters}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-800"
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
                    d="M3 6h18M9 6V4h6v2M8 10v7M12 10v7M16 10v7M5 6l1 15h12l1-15"
                  />
                </svg>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="min-h-0 overflow-auto">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50/70">
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Sale #
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Invoice #
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Type
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Amount
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Requested
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedRequests.map((request) => (
                  <tr
                    key={request.id}
                    className="border-b border-slate-100 last:border-b-0 transition hover:bg-slate-50/70"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-800">
                      {request.sale?.sale_number ?? "—"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                      {request.sale?.invoice_number ?? "—"}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getRequestActionClass(
                          request.action_type,
                        )}`}
                      >
                        {getRequestActionLabel(request.action_type)}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-slate-800">
                      {formatCurrency(Number(request.sale?.total ?? 0))}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getRequestStatusClass(
                          request.status,
                        )}`}
                      >
                        {getRequestStatusLabel(request.status)}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                      {formatDate(request.created_at)}
                    </td>
                  </tr>
                ))}

                {paginatedRequests.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-sm text-slate-400"
                    >
                      No requests
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-sm text-slate-500">
            {total > 0 ? (
              <>
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {from}–{to}
                </span>{" "}
                of <span className="font-semibold text-slate-700">{total}</span>{" "}
                requests
              </>
            ) : (
              "No requests"
            )}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
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
              Page {currentPage} of {lastPage}
            </span>

            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === lastPage}
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

        {/* Footer Notices */}
        <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">
          {myActionRequests.some((request) => request.status === "pending") && (
            <div className="flex items-start gap-3 text-sm text-amber-700">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-3.5 w-3.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 16h.01"
                  />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </div>

              <p>
                You have a pending request waiting for Manager/Admin approval.
              </p>
            </div>
          )}

          {myActionRequests.some(
            (request) => request.status === "rejected",
          ) && (
            <div className="mt-2 flex items-start gap-3 text-sm text-red-600">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-3.5 w-3.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m9 9 6 6M15 9l-6 6"
                  />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </div>

              <p>
                Some of your requests were rejected. Check the request details
                in the table above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
