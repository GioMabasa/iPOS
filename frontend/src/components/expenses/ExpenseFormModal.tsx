import type { ExpenseCategory, ExpenseFormData } from "../../types/expense";

interface ExpenseFormModalProps {
  showModal: boolean;
  editingExpense: boolean;
  saving: boolean;
  formData: ExpenseFormData;
  categories: ExpenseCategory[];
  onClose: () => void;
  onSave: () => void;
  onUpdateField: <K extends keyof ExpenseFormData>(
    field: K,
    value: ExpenseFormData[K],
  ) => void;
}

export default function ExpenseFormModal({
  showModal,
  editingExpense,
  saving,
  formData,
  categories,
  onClose,
  onSave,
  onUpdateField,
}: ExpenseFormModalProps) {
  if (!showModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        {/* Header */}
        <div className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-violet-50 px-5 py-5">
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-indigo-100/60" />
          <div className="absolute -bottom-12 left-1/3 h-24 w-24 rounded-full bg-violet-100/50" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
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
                    d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3 1.343 3 3-1.343 3-3 3m0-12V5m0 14v-3m7-4h-3M8 12H5m13.364-4.364-2.121 2.121M7.757 16.243l-2.121 2.121m0-12.728 2.121 2.121m10.607 10.607-2.121-2.121"
                  />
                </svg>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingExpense ? "Edit Expense" : "Add Expense"}
                </h2>

                <p className="mt-0.5 text-sm text-slate-500">
                  {editingExpense
                    ? "Update the expense information."
                    : "Record a new business expense."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="relative rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-slate-600 disabled:opacity-50"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[75vh] overflow-y-auto px-5 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Category */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Expense Category
              </label>

              <select
                value={formData.expense_category_id || ""}
                onChange={(e) =>
                  onUpdateField("expense_category_id", Number(e.target.value))
                }
                disabled={saving}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
              >
                <option value="">Select category</option>

                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Expense Date
              </label>

              <input
                type="date"
                value={formData.expense_date}
                onChange={(e) => onUpdateField("expense_date", e.target.value)}
                disabled={saving}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Description <span className="text-rose-500">*</span>
              </label>

              <input
                type="text"
                value={formData.description}
                onChange={(e) => onUpdateField("description", e.target.value)}
                placeholder="e.g. Monthly store rent"
                disabled={saving}
                className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                  !formData.description.trim()
                    ? "border-slate-300 focus:border-indigo-500 focus:ring-indigo-50"
                    : "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-50"
                }`}
              />

              <p className="mt-1.5 text-xs text-slate-500">
                Provide a clear description of the expense.
              </p>
            </div>

            {/* Amount */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Amount <span className="text-rose-500">*</span>
              </label>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                  ₱
                </span>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.amount || ""}
                  onChange={(e) =>
                    onUpdateField("amount", Number(e.target.value))
                  }
                  disabled={saving}
                  placeholder="0.00"
                  className={`w-full rounded-xl border bg-white py-2.5 pl-8 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                    Number(formData.amount) <= 0
                      ? "border-slate-300 focus:border-indigo-500 focus:ring-indigo-50"
                      : "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-50"
                  }`}
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Payment Method
              </label>

              <select
                value={formData.payment_method}
                onChange={(e) =>
                  onUpdateField("payment_method", e.target.value)
                }
                disabled={saving}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="GCash">GCash</option>
                <option value="Maya">Maya</option>
                <option value="Check">Check</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Reference */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Reference No.{" "}
                <span className="font-normal text-slate-400">(Optional)</span>
              </label>

              <input
                type="text"
                value={formData.reference_no || ""}
                onChange={(e) => onUpdateField("reference_no", e.target.value)}
                placeholder="e.g. OR-001234"
                disabled={saving}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Notes{" "}
                <span className="font-normal text-slate-400">(Optional)</span>
              </label>

              <textarea
                value={formData.notes || ""}
                onChange={(e) => onUpdateField("notes", e.target.value)}
                rows={3}
                placeholder="Additional notes..."
                disabled={saving}
                className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-5 py-4">
          <p className="text-xs text-slate-500">
            <span className="text-rose-500">*</span> Required fields
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onSave}
              disabled={
                saving ||
                !formData.description.trim() ||
                Number(formData.amount) <= 0
              }
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
            >
              {saving
                ? "Saving..."
                : editingExpense
                  ? "Update Expense"
                  : "Save Expense"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
