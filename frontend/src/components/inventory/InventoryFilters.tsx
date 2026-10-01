interface Supplier {
  id: number | string;
  name: string;
}

interface InventoryFiltersProps {
  search: string;
  setSearch: (value: string) => void;

  stockFilter: "all" | "in_stock" | "low_stock" | "out_of_stock";
  setStockFilter: (
    value: "all" | "in_stock" | "low_stock" | "out_of_stock",
  ) => void;

  productStatusFilter: "all" | "active" | "inactive";
  setProductStatusFilter: (value: "all" | "active" | "inactive") => void;

  supplierFilter: string;
  setSupplierFilter: (value: string) => void;

  suppliers: Supplier[];
  suppliersLoading: boolean;
}

export default function InventoryFilters({
  search,
  setSearch,
  stockFilter,
  setStockFilter,
  productStatusFilter,
  setProductStatusFilter,
  supplierFilter,
  setSupplierFilter,
  suppliers,
  suppliersLoading,
}: InventoryFiltersProps) {
  const hasActiveFilters =
    search ||
    stockFilter !== "all" ||
    productStatusFilter !== "active" ||
    supplierFilter;

  const handleClearFilters = () => {
    setSearch("");
    setStockFilter("all");
    setProductStatusFilter("active");
    setSupplierFilter("");
  };

  return (
    <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
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
              d="M4.5 6.75h15M7.5 12h9m-6 5.25h3"
            />
          </svg>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-800">
            Inventory Filters
          </p>

          <p className="text-xs text-slate-400">
            Search and filter your inventory.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="relative xl:col-span-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          >
            <circle cx="11" cy="11" r="6.75" />

            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m16 16 4.25 4.25"
            />
          </svg>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product, SKU or barcode..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <select
          value={stockFilter}
          onChange={(e) =>
            setStockFilter(
              e.target.value as
                | "all"
                | "in_stock"
                | "low_stock"
                | "out_of_stock",
            )
          }
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        >
          <option value="all">All Stock</option>
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>

        <select
          value={productStatusFilter}
          onChange={(e) =>
            setProductStatusFilter(
              e.target.value as "all" | "active" | "inactive",
            )
          }
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="all">All Products</option>
        </select>

        <select
          value={supplierFilter}
          onChange={(e) => setSupplierFilter(e.target.value)}
          disabled={suppliersLoading}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
        >
          <option value="">
            {suppliersLoading ? "Loading Suppliers..." : "All Suppliers"}
          </option>

          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={handleClearFilters}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
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
                d="M6 6l12 12M18 6 6 18"
              />
            </svg>
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
