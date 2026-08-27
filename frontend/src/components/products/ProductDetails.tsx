import type { Product } from "../../types/product";

interface ProductDetailsProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
}

export default function ProductDetails({
  isOpen,
  product,
  onClose,
}: ProductDetailsProps) {
  if (!isOpen || !product) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-xl">
        {/* ============================================================
            HEADER
        ============================================================ */}

        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Product Details
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              View product information.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-xl text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* ==========================================================
              BASIC INFORMATION
          ========================================================== */}

          <section>
            <h3 className="mb-4 text-base font-semibold text-gray-900">
              Basic Information
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Product Name */}

              <div>
                <p className="text-xs text-gray-500">Product Name</p>

                <p className="mt-1 font-medium text-gray-900">{product.name}</p>
              </div>

              {/* Category */}

              <div>
                <p className="text-xs text-gray-500">Category</p>

                <p className="mt-1 font-medium text-gray-900">
                  {product.category?.name ?? "-"}
                </p>
              </div>

              {/* SKU */}

              <div>
                <p className="text-xs text-gray-500">SKU</p>

                <p className="mt-1 text-gray-900">{product.sku}</p>
              </div>

              {/* Barcode */}

              <div>
                <p className="text-xs text-gray-500">Barcode</p>

                <p className="mt-1 text-gray-900">{product.barcode || "-"}</p>
              </div>

              {/* Unit */}

              <div>
                <p className="text-xs text-gray-500">Unit</p>

                <p className="mt-1 text-gray-900">{product.unit}</p>
              </div>

              {/* Status */}

              <div>
                <p className="text-xs text-gray-500">Status</p>

                <span
                  className={
                    product.is_active
                      ? "mt-1 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                      : "mt-1 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
                  }
                >
                  {product.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </section>

          {/* ==========================================================
              DESCRIPTION
          ========================================================== */}

          <section>
            <h3 className="mb-2 text-base font-semibold text-gray-900">
              Description
            </h3>

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-600">
                {product.description || "No description."}
              </p>
            </div>
          </section>

          {/* ==========================================================
              PRICING & INVENTORY
          ========================================================== */}

          <section>
            <h3 className="mb-4 text-base font-semibold text-gray-900">
              Pricing & Inventory
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Selling Price */}

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs text-gray-500">Selling Price</p>

                <p className="mt-1 text-lg font-semibold text-gray-900">
                  ₱{Number(product.selling_price).toFixed(2)}
                </p>
              </div>

              {/* Minimum Stock */}

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs text-gray-500">Minimum Stock</p>

                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {product.minimum_stock} {product.unit}
                </p>
              </div>

              {/* Product ID */}

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs text-gray-500">Product ID</p>

                <p className="mt-1 text-lg font-semibold text-gray-900">
                  #{product.id}
                </p>
              </div>
            </div>
          </section>

          {/* ==========================================================
              SUPPLIERS
          ========================================================== */}

          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Suppliers
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Supplier-specific cost prices.
                </p>
              </div>
            </div>

            {product.suppliers && product.suppliers.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Supplier</th>

                      <th className="px-4 py-3 font-semibold">Supplier SKU</th>

                      <th className="px-4 py-3 font-semibold">Cost Price</th>

                      <th className="px-4 py-3 font-semibold">Preferred</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {product.suppliers.map((supplier) => (
                      <tr key={supplier.id} className="hover:bg-gray-50">
                        {/* Supplier */}

                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {supplier.name}
                          </div>

                          {supplier.contact_person && (
                            <div className="text-xs text-gray-500">
                              {supplier.contact_person}
                            </div>
                          )}
                        </td>

                        {/* Supplier SKU */}

                        <td className="px-4 py-3 text-gray-600">
                          {supplier.pivot?.supplier_sku || "-"}
                        </td>

                        {/* Cost Price */}

                        <td className="px-4 py-3 font-medium text-gray-900">
                          ₱{Number(supplier.pivot?.cost_price ?? 0).toFixed(2)}
                        </td>

                        {/* Preferred */}

                        <td className="px-4 py-3">
                          {supplier.pivot?.is_preferred ? (
                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                              Preferred
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500">
                No suppliers assigned.
              </div>
            )}
          </section>

          {/* ==========================================================
              FOOTER
          ========================================================== */}

          <div className="flex justify-end border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
