interface SalesHeaderProps {
  user: {
    role?: string;
  } | null;
  handleExport: () => void;
  exportLoading: boolean;
}

export default function SalesHeader({
  user,
  handleExport,
  exportLoading,
}: SalesHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
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
                  d="M3 3v18h18"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m7 15 3-3 3 2 5-6"
                />
              </svg>
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Sales
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                View completed, refunded, and voided sales transactions.
              </p>
            </div>
          </div>
        </div>

        {user?.role !== "cashier" && (
          <div>
            <button
              type="button"
              onClick={handleExport}
              disabled={exportLoading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 border border-emerald-200"
            >
              {exportLoading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4Z"
                    />
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
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
                      d="M12 3v12"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m8 11 4 4 4-4"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 21h14"
                    />
                  </svg>
                  Export Sales to Spreadsheet
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
