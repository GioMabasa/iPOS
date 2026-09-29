import type { InventorySummary } from "../../types/inventory";

interface InventorySummaryCardsProps {
  inventorySummary: InventorySummary;

  formatQuantity: (value: string | number) => string;

  openHistory: (type: "bad_order" | "adjustment") => void;
}

export default function InventorySummaryCards({
  inventorySummary,
  formatQuantity,
  openHistory,
}: InventorySummaryCardsProps) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Products</p>

            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {inventorySummary.total_products.toLocaleString("en-PH")}
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 7.5h9M7.5 12h9M7.5 16.5h5.25"
              />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.25 3.75h13.5A2.25 2.25 0 0 1 21 6v12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18V6a2.25 2.25 0 0 1 2.25-2.25Z"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Stock</p>

            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {formatQuantity(inventorySummary.total_stock)}
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
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
                d="m4.5 7.5 7.5-4.125L19.5 7.5 12 11.625 4.5 7.5Z"
              />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m4.5 7.5 7.5 4.125L19.5 7.5M4.5 12l7.5 4.125L19.5 12M4.5 16.5l7.5 4.125 7.5-4.125"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">Low Stock</p>

            <p className="mt-2 text-2xl font-bold tracking-tight text-amber-600">
              {inventorySummary.low_stock.toLocaleString("en-PH")}
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
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
                d="M12 3.75 21 19.5H3L12 3.75Z"
              />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v4.5M12 16.5h.007"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">Out of Stock</p>

            <p className="mt-2 text-2xl font-bold tracking-tight text-red-600">
              {inventorySummary.out_of_stock.toLocaleString("en-PH")}
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
            >
              <circle cx="12" cy="12" r="8.25" />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m9 9 6 6m0-6-6 6"
              />
            </svg>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => openHistory("bad_order")}
        className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-red-200 hover:bg-red-50/40 hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">Bad Orders</p>

            <p className="mt-2 text-2xl font-bold tracking-tight text-red-600">
              {formatQuantity(inventorySummary.bad_orders)}
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
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
                d="M6.75 6.75h10.5M8.25 6.75v10.5A2.25 2.25 0 0 0 10.5 19.5h3A2.25 2.25 0 0 0 15.75 17.25V6.75M9.75 6.75V5.25A1.5 1.5 0 0 1 11.25 3.75h1.5a1.5 1.5 0 0 1 1.5 1.5v1.5"
              />
            </svg>
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => openHistory("adjustment")}
        className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">Adjustments</p>

            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-700">
              {inventorySummary.adjustments.toLocaleString("en-PH")}
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
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
                d="M12 3.75v16.5M3.75 12h16.5"
              />
            </svg>
          </div>
        </div>
      </button>
    </div>
  );
}
