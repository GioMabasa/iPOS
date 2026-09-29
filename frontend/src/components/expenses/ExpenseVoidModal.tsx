import type { Expense } from "../../types/expense";

interface ExpenseVoidModalProps {
  expense: Expense | null;
  voiding: boolean;
  formatAmount: (value: number | string) => string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ExpenseVoidModal({
  expense,
  voiding,
  formatAmount,
  onClose,
  onConfirm,
}: ExpenseVoidModalProps) {
  if (!expense) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="px-5 py-5">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-red-100 p-2 text-red-600">
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v4m0 4h.01"
                />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Void Expense
              </h3>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Are you sure you want to void this expense? This record will be
                preserved for audit and reporting purposes.
              </p>

              <div className="mt-3 rounded-xl bg-gray-50 p-3">
                <p className="text-sm font-medium text-gray-900">
                  {expense.description}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  ₱{formatAmount(expense.amount)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={voiding}
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={voiding}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {voiding ? "Voiding..." : "Void Expense"}
          </button>
        </div>
      </div>
    </div>
  );
}
