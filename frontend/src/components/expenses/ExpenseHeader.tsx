import type { ReactNode } from "react";

interface ExpenseHeaderProps {
  exporting: boolean;
  onExport: () => void;
  onAddExpense: () => void;
  exportButton?: ReactNode;
}

export default function ExpenseHeader({
  exporting,
  onExport,
  onAddExpense,
}: ExpenseHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Expense Management</h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage business operating expenses.
        </p>
      </div>

      <div className="inline-flex gap-2">
        <button
          type="button"
          onClick={onExport}
          disabled={exporting}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"
            />
          </svg>

          {exporting ? "Exporting..." : "Export Expenses to Spreadsheet"}
        </button>

        <button
          type="button"
          onClick={onAddExpense}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 5v14M5 12h14"
            />
          </svg>
          Add Product
        </button>
      </div>
    </div>
  );
}
