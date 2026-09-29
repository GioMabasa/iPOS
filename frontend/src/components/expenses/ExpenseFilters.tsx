import type { ExpenseCategory } from "../../types/expense";

interface ExpenseFiltersProps {
  search: string;
  categoryFilter: string;
  paymentMethodFilter: string;
  statusFilter: string;
  categories: ExpenseCategory[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onPaymentMethodChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

export default function ExpenseFilters({
  search,
  categoryFilter,
  paymentMethodFilter,
  statusFilter,
  categories,
  onSearchChange,
  onCategoryChange,
  onPaymentMethodChange,
  onStatusChange,
}: ExpenseFiltersProps) {
  const hasActiveFilter =
    search.trim() !== "" ||
    categoryFilter !== "" ||
    paymentMethodFilter !== "" ||
    statusFilter !== "";

  const clearFilters = () => {
    onSearchChange("");
    onCategoryChange("");
    onPaymentMethodChange("");
    onStatusChange("");
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      {" "}
      <div className="mb-3 flex items-center justify-between gap-3">
        {" "}
        <div className="flex items-center gap-2">
          {" "}
          <div className="rounded-lg bg-gray-100 p-2 text-gray-600">
            {" "}
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {" "}
              <path strokeLinecap="round" d="M4 6h16M7 12h10M10 18h4" />{" "}
            </svg>{" "}
          </div>{" "}
          <p className="text-sm font-semibold text-gray-900">
            {" "}
            Expense Filters{" "}
          </p>{" "}
        </div>{" "}
        {hasActiveFilter && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            {" "}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4"
            >
              {" "}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 6l12 12M18 6 6 18"
              />{" "}
            </svg>{" "}
            Clear Filters{" "}
          </button>
        )}{" "}
      </div>{" "}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5">
        {" "}
        {/* Search */}{" "}
        <div className="relative xl:col-span-2">
          {" "}
          <svg
            className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            {" "}
            <circle cx="11" cy="11" r="7" />{" "}
            <path strokeLinecap="round" d="M20 20l-3.5-3.5" />{" "}
          </svg>{" "}
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search description or reference..."
            className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />{" "}
        </div>{" "}
        {/* Category */}{" "}
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        >
          {" "}
          <option value="">All Categories</option>{" "}
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {" "}
              {category.name}{" "}
            </option>
          ))}{" "}
        </select>{" "}
        {/* Payment Method */}{" "}
        <select
          value={paymentMethodFilter}
          onChange={(e) => onPaymentMethodChange(e.target.value)}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        >
          {" "}
          <option value="">All Payment Methods</option>{" "}
          <option value="Cash">Cash</option>{" "}
          <option value="Bank Transfer">Bank Transfer</option>{" "}
          <option value="GCash">GCash</option>{" "}
          <option value="Maya">Maya</option>{" "}
          <option value="Check">Check</option>{" "}
          <option value="Other">Other</option>{" "}
        </select>{" "}
        {/* Status */}{" "}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        >
          {" "}
          <option value="">All Status</option>{" "}
          <option value="Recorded">Recorded</option>{" "}
          <option value="Voided">Voided</option>{" "}
        </select>{" "}
      </div>{" "}
    </div>
  );
}
