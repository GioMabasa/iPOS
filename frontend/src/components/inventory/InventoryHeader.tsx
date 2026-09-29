import type { InventoryResponse } from "../../types/inventory";

interface InventoryHeaderProps {
  exportLoading: boolean;
  loading: boolean;
  currentPage: number;

  handleExport: () => void | Promise<void>;
  loadInventory: (page?: number) => Promise<InventoryResponse | null>;
}

export default function InventoryHeader({
  exportLoading,
  loading,
  currentPage,
  handleExport,
  loadInventory,
}: InventoryHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
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
                d="M3.75 6.75A2.25 2.25 0 0 1 6 4.5h12a2.25 2.25 0 0 1 2.25 2.25v10.5A2.25 2.25 0 0 1 18 19.5H6a2.25 2.25 0 0 1-2.25-2.25V6.75Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 8.25h9M7.5 12h9M7.5 15.75h5.25"
              />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Inventory Management
            </h1>

            <p className="mt-0.5 text-sm text-slate-500">
              Monitor current stock levels and inventory status.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={handleExport}
          disabled={exportLoading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
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
              d="M12 3v12m0 0 4-4m-4 4-4-4"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 15.75v1.5A2.25 2.25 0 0 0 6.75 19.5h10.5a2.25 2.25 0 0 0 2.25-2.25v-1.5"
            />
          </svg>

          {exportLoading ? "Exporting..." : "Export Inventory to Spreadsheet"}
        </button>

        <button
          type="button"
          onClick={() => loadInventory(currentPage)}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
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
              d="M20.25 12a8.25 8.25 0 1 1-2.418-5.832"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 4.5v5.25H15"
            />
          </svg>

          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
    </div>
  );
}
