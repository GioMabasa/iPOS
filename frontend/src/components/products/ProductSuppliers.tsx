import { useEffect, useState } from "react";

import type { Product } from "../../types/product";
import type { Supplier } from "../../types/supplier";
import type { ProductSupplierPayload } from "../../types/productSupplier";

import { getSuppliers } from "../../services/supplierService";
import api from "../../services/api";

interface ProductSuppliersProps {
  product: Product;
}

interface SupplierRow {
  supplier_id: number | "";
  supplier_sku: string;
  cost_price: string;
  is_preferred: boolean;
}

export default function ProductSuppliers({ product }: ProductSuppliersProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [rows, setRows] = useState<SupplierRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Load Suppliers
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    async function loadSuppliers() {
      try {
        setLoading(true);
        setError(null);

        const data = await getSuppliers();

        setSuppliers(data.filter((supplier) => supplier.is_active));
      } catch (err) {
        console.error("Load suppliers error:", err);

        setError("Failed to load suppliers.");
      } finally {
        setLoading(false);
      }
    }

    loadSuppliers();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Load Existing Product Suppliers
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!product.suppliers) {
      setRows([]);
      return;
    }

    const existingRows: SupplierRow[] = product.suppliers.map(
      (supplier: any) => ({
        supplier_id: supplier.id,
        supplier_sku: supplier.pivot?.supplier_sku ?? "",
        cost_price: supplier.pivot?.cost_price ?? "",
        is_preferred: Boolean(supplier.pivot?.is_preferred),
      }),
    );

    setRows(existingRows);
  }, [product]);

  /*
  |--------------------------------------------------------------------------
  | Add Supplier
  |--------------------------------------------------------------------------
  */

  function addSupplier() {
    setRows((current) => [
      ...current,
      {
        supplier_id: "",
        supplier_sku: "",
        cost_price: "",
        is_preferred: current.length === 0,
      },
    ]);
  }

  /*
  |--------------------------------------------------------------------------
  | Remove Supplier
  |--------------------------------------------------------------------------
  */

  function removeSupplier(index: number) {
    setRows((current) => {
      const updated = current.filter((_, rowIndex) => rowIndex !== index);

      // If preferred supplier was removed,
      // automatically make the first supplier preferred.
      if (current[index]?.is_preferred && updated.length > 0) {
        updated[0].is_preferred = true;
      }

      return updated;
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Update Row
  |--------------------------------------------------------------------------
  */

  function updateRow(
    index: number,
    field: keyof SupplierRow,
    value: string | number | boolean,
  ) {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              [field]: value,
            }
          : row,
      ),
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Set Preferred Supplier
  |--------------------------------------------------------------------------
  */

  function setPreferred(index: number) {
    setRows((current) =>
      current.map((row, rowIndex) => ({
        ...row,
        is_preferred: rowIndex === index,
      })),
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Save Suppliers
  |--------------------------------------------------------------------------
  */

  async function saveSuppliers() {
    setError(null);
    setSuccess(null);

    /*
    |--------------------------------------------------------------------------
    | Validate
    |--------------------------------------------------------------------------
    */

    if (rows.length === 0) {
      setError("Please add at least one supplier.");

      return;
    }

    const incompleteRow = rows.find(
      (row) => !row.supplier_id || !row.cost_price,
    );

    if (incompleteRow) {
      setError("Please select a supplier and enter its cost price.");

      return;
    }

    const supplierIds = rows.map((row) => row.supplier_id);

    const uniqueSupplierIds = new Set(supplierIds);

    if (uniqueSupplierIds.size !== supplierIds.length) {
      setError("A supplier cannot be added more than once.");

      return;
    }

    const preferredCount = rows.filter((row) => row.is_preferred).length;

    if (preferredCount !== 1) {
      setError("Please select exactly one preferred supplier.");

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Prepare Payload
    |--------------------------------------------------------------------------
    */

    const payload: ProductSupplierPayload[] = rows.map((row) => ({
      supplier_id: Number(row.supplier_id),

      supplier_sku: row.supplier_sku.trim() || null,

      cost_price: row.cost_price,

      is_preferred: row.is_preferred,
    }));

    try {
      setSaving(true);

      await api.post(`/products/${product.id}/suppliers`, {
        suppliers: payload,
      });

      setSuccess("Product suppliers updated successfully.");
    } catch (err: any) {
      console.error("Save product suppliers error:", err);

      console.error("Response:", err?.response?.data);

      const validationErrors = err?.response?.data?.errors;

      if (validationErrors) {
        const firstError = Object.values(validationErrors)[0] as
          | string[]
          | undefined;

        if (firstError?.length) {
          setError(firstError[0]);
          return;
        }
      }

      setError(
        err?.response?.data?.message ?? "Failed to update product suppliers.",
      );
    } finally {
      setSaving(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="rounded-xl border bg-white">
      {/* ================================================================
          HEADER
      ================================================================ */}

      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Suppliers</h3>

          <p className="mt-1 text-sm text-gray-500">
            Manage suppliers and supplier-specific cost prices for this product.
          </p>
        </div>

        <button
          type="button"
          onClick={addSupplier}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          + Add Supplier
        </button>
      </div>

      {/* ================================================================
          MESSAGES
      ================================================================ */}

      {error && (
        <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="mx-6 mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* ================================================================
          LOADING
      ================================================================ */}

      {loading && (
        <div className="px-6 py-8 text-center text-sm text-gray-500">
          Loading suppliers...
        </div>
      )}

      {/* ================================================================
          NO SUPPLIERS
      ================================================================ */}

      {!loading && rows.length === 0 && (
        <div className="px-6 py-10 text-center">
          <p className="text-sm text-gray-500">
            No suppliers assigned to this product.
          </p>

          <button
            type="button"
            onClick={addSupplier}
            className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Add Supplier
          </button>
        </div>
      )}

      {/* ================================================================
          SUPPLIER ROWS
      ================================================================ */}

      {!loading && rows.length > 0 && (
        <div className="space-y-4 p-6">
          {rows.map((row, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                {/* Supplier */}

                <div className="md:col-span-4">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Supplier
                  </label>

                  <select
                    value={row.supplier_id}
                    onChange={(e) =>
                      updateRow(
                        index,
                        "supplier_id",
                        e.target.value ? Number(e.target.value) : "",
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Select supplier</option>

                    {suppliers.map((supplier) => (
                      <option
                        key={supplier.id}
                        value={supplier.id}
                        disabled={rows.some(
                          (item, itemIndex) =>
                            itemIndex !== index &&
                            item.supplier_id === supplier.id,
                        )}
                      >
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Supplier SKU */}

                <div className="md:col-span-3">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Supplier SKU
                  </label>

                  <input
                    type="text"
                    value={row.supplier_sku}
                    onChange={(e) =>
                      updateRow(index, "supplier_sku", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                    placeholder="Optional"
                  />
                </div>

                {/* Cost Price */}

                <div className="md:col-span-3">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Cost Price
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                      ₱
                    </span>

                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={row.cost_price}
                      onChange={(e) =>
                        updateRow(index, "cost_price", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-8 pr-3 text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Remove */}

                <div className="flex items-end justify-end md:col-span-2">
                  <button
                    type="button"
                    onClick={() => removeSupplier(index)}
                    disabled={saving}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* Preferred */}

              <div className="mt-3 flex items-center gap-3 border-t pt-3">
                <input
                  id={`preferred-${index}`}
                  type="radio"
                  name="preferred_supplier"
                  checked={row.is_preferred}
                  onChange={() => setPreferred(index)}
                  className="h-4 w-4"
                />

                <label
                  htmlFor={`preferred-${index}`}
                  className="text-sm font-medium text-gray-700"
                >
                  Preferred Supplier
                </label>
              </div>
            </div>
          ))}

          {/* ============================================================
              SAVE
          ============================================================ */}

          <div className="flex justify-end border-t pt-4">
            <button
              type="button"
              onClick={saveSuppliers}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Suppliers"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
