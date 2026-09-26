import type { Supplier } from "../../types/supplier";

export type PurchasePeriod =
  | "all"
  | "today"
  | "yesterday"
  | "this_week"
  | "this_month"
  | "this_year"
  | "custom";

interface PurchaseFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;

  purchaseSupplierFilter: number | "";
  onSupplierChange: (value: number | "") => void;

  purchaseSuppliers: Supplier[];
  loadingPurchaseSuppliers: boolean;

  purchasePeriod: PurchasePeriod;
  onPeriodChange: (value: PurchasePeriod) => void;

  purchaseStartDate: string;
  onStartDateChange: (value: string) => void;

  purchaseEndDate: string;
  onEndDateChange: (value: string) => void;
}

export default function PurchaseFilters({
  search,
  onSearchChange,
  purchaseSupplierFilter,
  onSupplierChange,
  purchaseSuppliers,
  loadingPurchaseSuppliers,
  purchasePeriod,
  onPeriodChange,
  purchaseStartDate,
  onStartDateChange,
  purchaseEndDate,
  onEndDateChange,
}: PurchaseFiltersProps) {
  return (
    <div className="border-b border-slate-200 p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            Purchase Records
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            View and manage your received inventory purchases.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          {/* Search */}
          <div className="md:col-span-2 xl:col-span-4">
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Purchase no., supplier, reference..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Supplier */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Supplier
            </label>
            <select
              value={purchaseSupplierFilter}
              onChange={(event) =>
                onSupplierChange(
                  event.target.value ? Number(event.target.value) : "",
                )
              }
              disabled={loadingPurchaseSuppliers}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
            >
              <option value="">
                {loadingPurchaseSuppliers
                  ? "Loading suppliers..."
                  : "All Suppliers"}
              </option>

              {purchaseSuppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          {/* Period */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Period
            </label>
            <select
              value={purchasePeriod}
              onChange={(event) =>
                onPeriodChange(event.target.value as PurchasePeriod)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="all">All Periods</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="this_year">This Year</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Custom dates */}
          {purchasePeriod === "custom" && (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Start Date
                </label>
                <input
                  type="date"
                  value={purchaseStartDate}
                  onChange={(event) => onStartDateChange(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  End Date
                </label>
                <input
                  type="date"
                  value={purchaseEndDate}
                  onChange={(event) => onEndDateChange(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
