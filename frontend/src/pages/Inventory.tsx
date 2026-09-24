import { useEffect, useMemo, useState } from "react";

import type {
  InventoryProduct,
  InventorySummary,
  InventoryTransaction,
  InventoryHistoryTransaction,
} from "../types/inventory";

import {
  adjustInventory,
  getInventory,
  getProductTransactions,
  getInventoryHistory,
  exportInventory,
} from "../services/inventoryService";

import { getSuppliers } from "../services/supplierService";

import type { Supplier } from "../types/supplier";

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryProduct[]>([]);

  const [inventorySummary, setInventorySummary] = useState<InventorySummary>({
    total_products: 0,
    total_stock: 0,
    low_stock: 0,
    out_of_stock: 0,
    bad_orders: 0,
    adjustments: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<
    "all" | "in_stock" | "low_stock" | "out_of_stock"
  >("all");

  const [productStatusFilter, setProductStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("active");

  const [supplierFilter, setSupplierFilter] = useState("");

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);

  const [exportLoading, setExportLoading] = useState(false);

  const PER_PAGE = 20;

  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [from, setFrom] = useState<number | null>(null);
  const [to, setTo] = useState<number | null>(null);

  const [selectedProduct, setSelectedProduct] =
    useState<InventoryProduct | null>(null);

  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsError, setTransactionsError] = useState("");

  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionLastPage, setTransactionLastPage] = useState(1);
  const [transactionTotal, setTransactionTotal] = useState(0);

  /*
  |--------------------------------------------------------------------------
  | Inventory History Modal
  |--------------------------------------------------------------------------
  */

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyType, setHistoryType] = useState<
    "bad_order" | "adjustment" | null
  >(null);
  const [historyTransactions, setHistoryTransactions] = useState<
    InventoryHistoryTransaction[]
  >([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLastPage, setHistoryLastPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);

  /*
  |--------------------------------------------------------------------------
  | Adjustment Modal
  |--------------------------------------------------------------------------
  */

  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [adjustmentProduct, setAdjustmentProduct] =
    useState<InventoryProduct | null>(null);
  const [adjustmentProductSearch, setAdjustmentProductSearch] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<
    "adjustment" | "bad_order"
  >("bad_order");
  const [adjustmentDirection, setAdjustmentDirection] = useState<
    "increase" | "decrease"
  >("increase");
  const [adjustmentQuantity, setAdjustmentQuantity] = useState("");
  const [adjustmentNotes, setAdjustmentNotes] = useState("");
  const [adjustmentLoading, setAdjustmentLoading] = useState(false);
  const [adjustmentError, setAdjustmentError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Load Suppliers
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        setSuppliersLoading(true);

        const response = await getSuppliers({
          page: 1,
          per_page: 100,
          status: "active",
        });

        setSuppliers(response.data ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setSuppliersLoading(false);
      }
    };

    loadSuppliers();
  }, []);

  const loadInventory = async (page: number = 1) => {
    try {
      setLoading(true);
      setError("");

      const response = await getInventory({
        page,
        per_page: PER_PAGE,
        search,
        stock_filter: stockFilter,
        product_status: productStatusFilter,
        ...(supplierFilter
          ? {
              supplier_id: Number(supplierFilter),
            }
          : {}),
      } as Parameters<typeof getInventory>[0]);

      setInventory(response.data);
      setInventorySummary(response.summary);

      setCurrentPage(Number(response.current_page));
      setLastPage(Number(response.last_page));
      setTotal(Number(response.total));
      setFrom(response.from === null ? null : Number(response.from));
      setTo(response.to === null ? null : Number(response.to));

      return response;
    } catch (err) {
      console.error(err);
      setError("Unable to load inventory.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory(1);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadInventory(1);
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [search, stockFilter, productStatusFilter, supplierFilter]);

  function goToPage(page: number) {
    if (page < 1 || page > lastPage || page === currentPage || loading) {
      return;
    }

    loadInventory(page);
  }

  /*
  |--------------------------------------------------------------------------
  | Export Inventory
  |--------------------------------------------------------------------------
  */

  const handleExport = async () => {
    try {
      setExportLoading(true);
      setError("");

      const blob = await exportInventory({
        search,
        stock_filter: stockFilter,
        product_status: productStatusFilter,
        ...(supplierFilter
          ? {
              supplier_id: Number(supplierFilter),
            }
          : {}),
      } as Parameters<typeof exportInventory>[0]);

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `inventory-${new Date().toISOString().slice(0, 10)}.xlsx`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("Unable to export inventory.");
    } finally {
      setExportLoading(false);
    }
  };

  const loadTransactions = async (productId: number, page: number = 1) => {
    try {
      setTransactionsLoading(true);
      setTransactionsError("");

      const response = await getProductTransactions(productId, page);

      setTransactions(response.data.data ?? []);
      setTransactionPage(response.data.current_page ?? 1);
      setTransactionLastPage(response.data.last_page ?? 1);
      setTransactionTotal(response.data.total ?? 0);
    } catch (err) {
      console.error(err);
      setTransactionsError("Unable to load inventory transactions.");
    } finally {
      setTransactionsLoading(false);
    }
  };

  const openProductDetails = async (product: InventoryProduct) => {
    setSelectedProduct(product);
    setTransactions([]);
    setTransactionPage(1);
    setTransactionLastPage(1);
    setTransactionTotal(0);

    await loadTransactions(product.product_id, 1);
  };

  const closeProductDetails = () => {
    if (transactionsLoading) {
      return;
    }

    setSelectedProduct(null);
    setTransactions([]);
    setTransactionsError("");
    setTransactionPage(1);
    setTransactionLastPage(1);
    setTransactionTotal(0);
  };

  /*
  |--------------------------------------------------------------------------
  | Inventory History
  |--------------------------------------------------------------------------
  */

  const loadHistory = async (
    type: "bad_order" | "adjustment",
    page: number = 1,
  ) => {
    try {
      setHistoryLoading(true);
      setHistoryError("");

      const response = await getInventoryHistory(type, page);

      setHistoryTransactions(response.data.data ?? []);
      setHistoryPage(response.data.current_page ?? 1);
      setHistoryLastPage(response.data.last_page ?? 1);
      setHistoryTotal(response.data.total ?? 0);
    } catch (err) {
      console.error(err);
      setHistoryError("Unable to load inventory history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const openHistory = async (type: "bad_order" | "adjustment") => {
    setHistoryType(type);
    setHistoryTransactions([]);
    setHistoryPage(1);
    setHistoryLastPage(1);
    setHistoryTotal(0);
    setHistoryError("");
    setHistoryModalOpen(true);

    await loadHistory(type, 1);
  };

  const closeHistory = () => {
    if (historyLoading) {
      return;
    }

    setHistoryModalOpen(false);
    setHistoryType(null);
    setHistoryTransactions([]);
    setHistoryError("");
    setHistoryPage(1);
    setHistoryLastPage(1);
    setHistoryTotal(0);
  };

  /*
  |--------------------------------------------------------------------------
  | Open Adjustment Modal
  |--------------------------------------------------------------------------
  */

  const openAdjustmentModal = (product?: InventoryProduct) => {
    setAdjustmentProduct(product ?? null);
    setAdjustmentProductSearch("");
    setAdjustmentType("bad_order");
    setAdjustmentDirection("increase");
    setAdjustmentQuantity("");
    setAdjustmentNotes("");
    setAdjustmentError("");
    setAdjustmentModalOpen(true);
  };

  /*
  |--------------------------------------------------------------------------
  | Close Adjustment Modal
  |--------------------------------------------------------------------------
  */

  const closeAdjustmentModal = () => {
    if (adjustmentLoading) {
      return;
    }

    setAdjustmentModalOpen(false);
    setAdjustmentProduct(null);
    setAdjustmentProductSearch("");
    setAdjustmentQuantity("");
    setAdjustmentNotes("");
    setAdjustmentError("");
  };

  /*
  |--------------------------------------------------------------------------
  | Adjustment Product Search
  |--------------------------------------------------------------------------
  */

  const adjustmentProductResults = useMemo(() => {
    const searchValue = adjustmentProductSearch.trim().toLowerCase();

    if (!searchValue) {
      return inventory;
    }

    return inventory.filter((product) => {
      return (
        product.name.toLowerCase().includes(searchValue) ||
        product.sku.toLowerCase().includes(searchValue) ||
        (product.barcode ?? "").toLowerCase().includes(searchValue)
      );
    });
  }, [inventory, adjustmentProductSearch]);

  /*
  |--------------------------------------------------------------------------
  | Select Adjustment Product
  |--------------------------------------------------------------------------
  */

  const selectAdjustmentProduct = (product: InventoryProduct) => {
    setAdjustmentProduct(product);
    setAdjustmentProductSearch("");
    setAdjustmentError("");
  };

  /*
  |--------------------------------------------------------------------------
  | Barcode Scanner
  |--------------------------------------------------------------------------
  */

  const handleAdjustmentBarcodeScan = (barcode: string) => {
    const scannedBarcode = barcode.trim();

    if (!scannedBarcode) {
      return;
    }

    const product = inventory.find(
      (item) =>
        item.barcode &&
        item.barcode.trim().toLowerCase() === scannedBarcode.toLowerCase(),
    );

    if (!product) {
      setAdjustmentError(`No product found for barcode "${scannedBarcode}".`);
      return;
    }

    selectAdjustmentProduct(product);
  };

  /*
  |--------------------------------------------------------------------------
  | Save Adjustment
  |--------------------------------------------------------------------------
  */

  const handleAdjustmentSubmit = async () => {
    setAdjustmentError("");

    if (!adjustmentProduct) {
      setAdjustmentError("Please select a product.");
      return;
    }

    const quantity = Number(adjustmentQuantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setAdjustmentError("Quantity must be greater than 0.");
      return;
    }

    /*
     * Bad Order always removes stock.
     */

    if (
      adjustmentType === "bad_order" &&
      quantity > Number(adjustmentProduct.stock)
    ) {
      setAdjustmentError(
        `Insufficient stock. Available stock: ${formatQuantity(
          adjustmentProduct.stock,
        )}.`,
      );
      return;
    }

    /*
     * Adjustment decrease removes stock.
     */

    if (
      adjustmentType === "adjustment" &&
      adjustmentDirection === "decrease" &&
      quantity > Number(adjustmentProduct.stock)
    ) {
      setAdjustmentError(
        `Insufficient stock. Available stock: ${formatQuantity(
          adjustmentProduct.stock,
        )}.`,
      );
      return;
    }

    try {
      setAdjustmentLoading(true);

      const finalQuantity =
        adjustmentType === "adjustment" && adjustmentDirection === "decrease"
          ? -quantity
          : quantity;

      await adjustInventory({
        product_id: adjustmentProduct.product_id,
        type: adjustmentType,
        quantity: finalQuantity,
        notes: adjustmentNotes.trim() || undefined,
      });

      const updatedInventory = await loadInventory(currentPage);

      /*
       * If the product details modal is open for the same product,
       * refresh its stock and transaction history.
       */

      if (
        updatedInventory &&
        selectedProduct?.product_id === adjustmentProduct.product_id
      ) {
        const refreshedProduct = updatedInventory.data.find(
          (product) => product.product_id === adjustmentProduct.product_id,
        );

        if (refreshedProduct) {
          setSelectedProduct(refreshedProduct);

          await loadTransactions(refreshedProduct.product_id, transactionPage);
        }
      }

      closeAdjustmentModal();
    } catch (err: any) {
      console.error(err);

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.quantity?.[0] ||
        err?.response?.data?.errors?.product_id?.[0] ||
        "Unable to adjust inventory.";

      setAdjustmentError(message);
    } finally {
      setAdjustmentLoading(false);
    }
  };

  const formatCurrency = (value: number | string) => {
    return `₱${Number(value).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatQuantity = (value: number | string) => {
    return Number(value).toLocaleString("en-PH", {
      maximumFractionDigits: 3,
    });
  };

  const formatDate = (value: string) => {
    return new Date(value).toLocaleString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getStockStatus = (product: InventoryProduct) => {
    const stock = Number(product.stock);

    if (stock <= 0) {
      return {
        label: "Out of Stock",
        className: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
      };
    }

    if (product.is_low_stock) {
      return {
        label: "Low Stock",
        className:
          "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
      };
    }

    return {
      label: "In Stock",
      className:
        "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
    };
  };

  const getProductStatus = (product: InventoryProduct) => {
    const isActive = Boolean(
      (product as InventoryProduct & { is_active?: boolean }).is_active,
    );

    if (isActive) {
      return {
        label: "Active",
        className:
          "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
      };
    }

    return {
      label: "Inactive",
      className: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
    };
  };

  const getTransactionLabel = (type: InventoryTransaction["type"]) => {
    switch (type) {
      case "purchase":
        return "Purchase";

      case "sale":
        return "Sale";

      case "refund":
        return "Refund";

      case "bad_order":
        return "Bad Order";

      case "adjustment":
        return "Adjustment";

      default:
        return type;
    }
  };

  const getTransactionClass = (type: InventoryTransaction["type"]) => {
    switch (type) {
      case "purchase":
        return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";

      case "sale":
        return "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200";

      case "refund":
        return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";

      case "bad_order":
        return "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200";

      case "adjustment":
        return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";

      default:
        return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";
    }
  };

  const getTransactionQuantityClass = (type: InventoryTransaction["type"]) => {
    switch (type) {
      case "purchase":
      case "refund":
      case "adjustment":
        return "text-emerald-600";

      case "sale":
      case "bad_order":
        return "text-red-600";

      default:
        return "text-slate-800";
    }
  };

  const formatReference = (transaction: InventoryTransaction) => {
    if (!transaction.reference_type && !transaction.reference_id) {
      return "—";
    }

    if (transaction.reference_type && transaction.reference_id) {
      return `${transaction.reference_type} #${transaction.reference_id}`;
    }

    return transaction.reference_type ?? `#${transaction.reference_id}`;
  };

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
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
                  d="M3.75 6.75A2.25 2.25 0 0 1 6 4.5h12a2.25 2.25 0 0 1 2.25 2.25v10.5A2.25 2.25 0 0 1 18 19.5H6a2.25 2.25 0 0 1-2.25-2.25V6.75Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.5 8.25h9M7.5 12h9M7.5 15.75h5.25"
                />
              </svg>
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Inventory
              </h1>

              <p className="mt-0.5 text-sm text-slate-500">
                Monitor current stock levels and inventory status.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => openAdjustmentModal()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 5v14M5 12h14"
              />
            </svg>
            Adjust Stock
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={exportLoading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
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
                d="M12 3v12m0 0 4-4m-4 4-4-4"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 15.75v1.5A2.25 2.25 0 0 0 6.75 19.5h10.5a2.25 2.25 0 0 0 2.25-2.25v-1.5"
              />
            </svg>
            {exportLoading ? "Exporting..." : "Export"}
          </button>

          <button
            type="button"
            onClick={() => loadInventory(currentPage)}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
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
                d="M20.25 12a8.25 8.25 0 1 1-2.418-5.832"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 4.5v5.25H15"
              />
            </svg>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Products
              </p>

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

      {/* Filters */}
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

        {(search ||
          stockFilter !== "all" ||
          productStatusFilter !== "active" ||
          supplierFilter) && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStockFilter("all");
                setProductStatusFilter("active");
                setSupplierFilter("");
              }}
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

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="mt-0.5 h-5 w-5 shrink-0"
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

          <span>{error}</span>
        </div>
      )}

      {/* Inventory Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Inventory List
            </p>

            <p className="mt-0.5 text-xs text-slate-400">
              Current stock, pricing, supplier and product status.
            </p>
          </div>

          <div className="hidden rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-500 sm:block">
            {total.toLocaleString("en-PH")} products
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center p-6 text-center">
            <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
            <p className="text-sm font-medium text-slate-600">
              Loading inventory...
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Please wait while the inventory is being loaded.
            </p>
          </div>
        ) : inventory.length === 0 ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center p-6 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m4.5 7.5 7.5-4.125L19.5 7.5 12 11.625 4.5 7.5Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 7.5v9L12 20.625l7.5-4.125v-9"
                />
              </svg>
            </div>

            <p className="text-sm font-semibold text-slate-700">
              No inventory items found
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1500px] text-sm">
              <thead className="bg-slate-50/80">
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Product
                  </th>

                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    SKU
                  </th>

                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Barcode
                  </th>

                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Supplier
                  </th>

                  <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Minimum Stock
                  </th>

                  <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Stock
                  </th>

                  <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Unit
                  </th>

                  <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Stock Value
                  </th>

                  <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Cost
                  </th>

                  <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Selling Price
                  </th>

                  <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Stock Status
                  </th>

                  <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Product Status
                  </th>

                  <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {inventory.map((product) => {
                  const stockStatus = getStockStatus(product);
                  const productStatus = getProductStatus(product);

                  return (
                    <tr
                      key={product.product_id}
                      className="group transition hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-800">
                          {product.name}
                        </div>
                      </td>

                      <td className="px-4 py-4 font-medium text-slate-600">
                        {product.sku || "—"}
                      </td>

                      <td className="px-4 py-4 font-mono text-xs text-slate-500">
                        {product.barcode || "—"}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {product.supplier || "—"}
                      </td>

                      <td className="px-4 py-4 text-right text-slate-600">
                        {formatQuantity(product.minimum_stock)}
                      </td>

                      <td className="px-4 py-4 text-right">
                        <span className="font-semibold text-slate-800">
                          {formatQuantity(product.stock)}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {product.unit}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right font-semibold text-slate-800">
                        {formatCurrency(product.stock_value)}
                      </td>

                      <td className="px-4 py-4 text-right text-slate-600">
                        {formatCurrency(product.cost)}
                      </td>

                      <td className="px-4 py-4 text-right font-semibold text-slate-800">
                        {formatCurrency(product.selling_price)}
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${stockStatus.className}`}
                        >
                          {stockStatus.label}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${productStatus.className}`}
                        >
                          {productStatus.label}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openProductDetails(product)}
                            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              className="h-3.5 w-3.5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.75 12s3.25-6 9.25-6 9.25 6 9.25 6-3.25 6-9.25 6-9.25-6-9.25-6Z"
                              />
                              <circle cx="12" cy="12" r="2.5" />
                            </svg>
                            View
                          </button>

                          <button
                            type="button"
                            onClick={() => openAdjustmentModal(product)}
                            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              className="h-3.5 w-3.5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 5v14M5 12h14"
                              />
                            </svg>
                            Adjust
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              {total > 0
                ? `Showing ${from}–${to} of ${total} products`
                : "No products"}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
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
                    d="m14.5 18-6-6 6-6"
                  />
                </svg>
                Previous
              </button>

              <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
                Page {currentPage} of {lastPage}
              </span>

              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === lastPage || loading}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
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
                    d="m9.5 6 6 6-6 6"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inventory History Modal */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    historyType === "bad_order"
                      ? "bg-red-50 text-red-600"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {historyType === "bad_order" ? (
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
                  ) : (
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
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-bold tracking-tight text-slate-900">
                    {historyType === "bad_order"
                      ? "Bad Order History"
                      : "Adjustment History"}
                  </h2>

                  <p className="mt-0.5 text-sm text-slate-500">
                    {historyType === "bad_order"
                      ? "Inventory transactions recorded as bad orders."
                      : "Inventory transactions recorded as manual adjustments."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeHistory}
                disabled={historyLoading}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
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
                    d="M6 6l12 12M18 6 6 18"
                  />
                </svg>
              </button>
            </div>

            <div className="max-h-[calc(90vh-140px)] overflow-y-auto p-5 sm:p-6">
              {historyError && (
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="mt-0.5 h-5 w-5 shrink-0"
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

                  <span>{historyError}</span>
                </div>
              )}

              <div className="overflow-hidden rounded-xl border border-slate-200">
                {historyLoading ? (
                  <div className="flex min-h-[220px] flex-col items-center justify-center p-6 text-center">
                    <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
                    <p className="text-sm font-medium text-slate-600">
                      Loading history...
                    </p>
                  </div>
                ) : historyTransactions.length === 0 ? (
                  <div className="flex min-h-[220px] flex-col items-center justify-center p-6 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-6 w-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5.25 5.25h13.5A1.25 1.25 0 0 1 20 6.5v11A1.25 1.25 0 0 1 18.75 18.75H5.25A1.25 1.25 0 0 1 4 17.5v-11a1.25 1.25 0 0 1 1.25-1.25Z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 9h8M8 12h8M8 15h5"
                        />
                      </svg>
                    </div>

                    <p className="text-sm font-semibold text-slate-700">
                      No inventory history found
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-[1050px] text-sm">
                      <thead className="bg-slate-50/80">
                        <tr className="border-b border-slate-200">
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Date
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Product
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            SKU
                          </th>

                          <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Type
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Qty
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Unit Cost
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Reference
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Notes
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {historyTransactions.map((transaction) => {
                          const quantity = Number(transaction.quantity);

                          const quantityClass =
                            historyType === "bad_order"
                              ? "text-red-600"
                              : quantity < 0
                                ? "text-red-600"
                                : "text-emerald-600";

                          const quantityPrefix =
                            historyType === "bad_order"
                              ? "-"
                              : quantity > 0
                                ? "+"
                                : quantity < 0
                                  ? "-"
                                  : "";

                          return (
                            <tr
                              key={transaction.id}
                              className="transition hover:bg-slate-50/70"
                            >
                              <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">
                                {formatDate(transaction.created_at)}
                              </td>

                              <td className="px-4 py-3.5">
                                <div className="font-semibold text-slate-800">
                                  {transaction.product?.name || "—"}
                                </div>
                              </td>

                              <td className="px-4 py-3.5 font-medium text-slate-500">
                                {transaction.product?.sku || "—"}
                              </td>

                              <td className="px-4 py-3.5 text-center">
                                <span
                                  className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${getTransactionClass(
                                    transaction.type,
                                  )}`}
                                >
                                  {getTransactionLabel(transaction.type)}
                                </span>
                              </td>

                              <td
                                className={`px-4 py-3.5 text-right font-semibold ${quantityClass}`}
                              >
                                {quantityPrefix}
                                {formatQuantity(Math.abs(quantity))}
                              </td>

                              <td className="px-4 py-3.5 text-right text-slate-600">
                                {transaction.unit_cost == null
                                  ? "—"
                                  : formatCurrency(transaction.unit_cost)}
                              </td>

                              <td className="px-4 py-3.5 text-slate-600">
                                {formatReference(transaction)}
                              </td>

                              <td className="max-w-[280px] px-4 py-3.5 text-slate-600">
                                <span className="block truncate">
                                  {transaction.notes || "—"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* History Pagination */}
              {!historyLoading && historyLastPage > 1 && (
                <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-slate-500">
                    {historyTotal} transaction
                    {historyTotal !== 1 ? "s" : ""}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={historyPage <= 1}
                      onClick={() => {
                        if (!historyType) {
                          return;
                        }

                        const nextPage = historyPage - 1;

                        setHistoryPage(nextPage);

                        loadHistory(historyType, nextPage);
                      }}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                          d="m14.5 18-6-6 6-6"
                        />
                      </svg>
                      Previous
                    </button>

                    <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
                      Page {historyPage} of {historyLastPage}
                    </span>

                    <button
                      type="button"
                      disabled={historyPage >= historyLastPage}
                      onClick={() => {
                        if (!historyType) {
                          return;
                        }

                        const nextPage = historyPage + 1;

                        setHistoryPage(nextPage);

                        loadHistory(historyType, nextPage);
                      }}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
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
                          d="m9.5 6 6 6-6 6"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={closeHistory}
                disabled={historyLoading}
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Details / Transaction History Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
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
                      d="M4.5 7.5 12 3.75l7.5 3.75L12 11.25 4.5 7.5Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 7.5v9l7.5 4.5 7.5-4.5v-9M8.25 9.375l7.5-3.75"
                    />
                  </svg>
                </div>

                <div>
                  <h2 className="text-lg font-bold tracking-tight text-slate-900">
                    Inventory Details
                  </h2>

                  <p className="mt-0.5 text-sm text-slate-500">
                    {selectedProduct.name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeProductDetails}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
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
                    d="M6 6l12 12M18 6 6 18"
                  />
                </svg>
              </button>
            </div>

            <div className="max-h-[calc(90vh-140px)] space-y-6 overflow-y-auto p-5 sm:p-6">
              {/* Product Information */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Product
                  </p>

                  <p className="mt-1.5 font-semibold text-slate-800">
                    {selectedProduct.name}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    SKU
                  </p>

                  <p className="mt-1.5 font-semibold text-slate-800">
                    {selectedProduct.sku || "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Current Stock
                  </p>

                  <p className="mt-1.5 font-semibold text-slate-800">
                    {formatQuantity(selectedProduct.stock)}{" "}
                    {selectedProduct.unit}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Status
                  </p>

                  <span
                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      getStockStatus(selectedProduct).className
                    }`}
                  >
                    {getStockStatus(selectedProduct).label}
                  </span>
                </div>
              </div>

              {/* Transaction History */}
              <div>
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      Transaction History
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-400">
                      Inventory movements for this product.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      loadTransactions(
                        selectedProduct.product_id,
                        transactionPage,
                      )
                    }
                    disabled={transactionsLoading}
                    className="inline-flex h-9 items-center justify-center gap-1.5 self-start rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                        d="M20.25 12a8.25 8.25 0 1 1-2.418-5.832"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20.25 4.5v5.25H15"
                      />
                    </svg>
                    {transactionsLoading ? "Refreshing..." : "Refresh"}
                  </button>
                </div>

                {transactionsError && (
                  <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="mt-0.5 h-5 w-5 shrink-0"
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

                    <span>{transactionsError}</span>
                  </div>
                )}

                <div className="overflow-hidden rounded-xl border border-slate-200">
                  {transactionsLoading ? (
                    <div className="flex min-h-[220px] flex-col items-center justify-center p-6 text-center">
                      <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
                      <p className="text-sm font-medium text-slate-600">
                        Loading transactions...
                      </p>
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="flex min-h-[220px] flex-col items-center justify-center p-6 text-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-6 w-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5.25 5.25h13.5A1.25 1.25 0 0 1 20 6.5v11A1.25 1.25 0 0 1 18.75 18.75H5.25A1.25 1.25 0 0 1 4 17.5v-11a1.25 1.25 0 0 1 1.25-1.25Z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 9h8M8 12h8M8 15h5"
                          />
                        </svg>
                      </div>

                      <p className="text-sm font-semibold text-slate-700">
                        No inventory transactions found
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-[900px] text-sm">
                        <thead className="bg-slate-50/80">
                          <tr className="border-b border-slate-200">
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Date
                            </th>

                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Type
                            </th>

                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Qty
                            </th>

                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Unit Cost
                            </th>

                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Reference
                            </th>

                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Notes
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {transactions.map((transaction) => (
                            <tr
                              key={transaction.id}
                              className="transition hover:bg-slate-50/70"
                            >
                              <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">
                                {formatDate(transaction.created_at)}
                              </td>

                              <td className="px-4 py-3.5 text-center">
                                <span
                                  className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${getTransactionClass(
                                    transaction.type,
                                  )}`}
                                >
                                  {getTransactionLabel(transaction.type)}
                                </span>
                              </td>

                              <td
                                className={`px-4 py-3.5 text-right font-semibold ${getTransactionQuantityClass(
                                  transaction.type,
                                )}`}
                              >
                                {["purchase", "refund"].includes(
                                  transaction.type,
                                )
                                  ? "+"
                                  : ["sale", "bad_order"].includes(
                                        transaction.type,
                                      )
                                    ? "-"
                                    : ""}
                                {formatQuantity(
                                  Math.abs(Number(transaction.quantity)),
                                )}
                              </td>

                              <td className="px-4 py-3.5 text-right text-slate-600">
                                {transaction.unit_cost == null
                                  ? "—"
                                  : formatCurrency(transaction.unit_cost)}
                              </td>

                              <td className="px-4 py-3.5 text-slate-600">
                                {formatReference(transaction)}
                              </td>

                              <td className="max-w-[300px] px-4 py-3.5 text-slate-600">
                                <span className="block truncate">
                                  {transaction.notes || "—"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Transaction Pagination */}
                {!transactionsLoading && transactionLastPage > 1 && (
                  <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-slate-500">
                      {transactionTotal} transaction
                      {transactionTotal !== 1 ? "s" : ""}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={transactionPage <= 1}
                        onClick={() => {
                          const nextPage = transactionPage - 1;

                          setTransactionPage(nextPage);

                          loadTransactions(
                            selectedProduct.product_id,
                            nextPage,
                          );
                        }}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                            d="m14.5 18-6-6 6-6"
                          />
                        </svg>
                        Previous
                      </button>

                      <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
                        Page {transactionPage} of {transactionLastPage}
                      </span>

                      <button
                        type="button"
                        disabled={transactionPage >= transactionLastPage}
                        onClick={() => {
                          const nextPage = transactionPage + 1;

                          setTransactionPage(nextPage);

                          loadTransactions(
                            selectedProduct.product_id,
                            nextPage,
                          );
                        }}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Next
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
                            d="m9.5 6 6 6-6 6"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={closeProductDetails}
                disabled={transactionsLoading}
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Inventory Modal */}
      {adjustmentModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
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
                      d="M12 5v14M5 12h14"
                    />
                  </svg>
                </div>

                <div>
                  <h2 className="text-lg font-bold tracking-tight text-slate-900">
                    Adjust Inventory
                  </h2>

                  <p className="mt-0.5 text-sm text-slate-500">
                    Record a bad order or manual stock adjustment.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeAdjustmentModal}
                disabled={adjustmentLoading}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
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
                    d="M6 6l12 12M18 6 6 18"
                  />
                </svg>
              </button>
            </div>

            <div className="max-h-[calc(90vh-140px)] space-y-5 overflow-y-auto p-5 sm:p-6">
              {adjustmentError && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="mt-0.5 h-5 w-5 shrink-0"
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

                  <span>{adjustmentError}</span>
                </div>
              )}

              {/* Product */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Product
                </label>

                {adjustmentProduct ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800">
                          {adjustmentProduct.name}
                        </div>

                        <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-slate-500 sm:grid-cols-2">
                          <span>
                            SKU:{" "}
                            <span className="font-medium text-slate-700">
                              {adjustmentProduct.sku || "—"}
                            </span>
                          </span>

                          <span>
                            Barcode:{" "}
                            <span className="font-medium text-slate-700">
                              {adjustmentProduct.barcode || "—"}
                            </span>
                          </span>

                          <span>
                            Current Stock:{" "}
                            <span className="font-semibold text-slate-700">
                              {formatQuantity(adjustmentProduct.stock)}{" "}
                              {adjustmentProduct.unit}
                            </span>
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setAdjustmentProduct(null);
                          setAdjustmentProductSearch("");
                          setAdjustmentError("");
                        }}
                        disabled={adjustmentLoading}
                        className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
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
                        value={adjustmentProductSearch}
                        onChange={(e) => {
                          setAdjustmentProductSearch(e.target.value);
                          setAdjustmentError("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key !== "Enter") {
                            return;
                          }

                          e.preventDefault();

                          handleAdjustmentBarcodeScan(adjustmentProductSearch);
                        }}
                        disabled={adjustmentLoading}
                        autoFocus
                        placeholder="Search product, SKU or barcode..."
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                      />
                    </div>

                    {adjustmentProductSearch.trim() && (
                      <div className="absolute left-0 right-0 top-full z-10 mt-2 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                        {adjustmentProductResults.length === 0 ? (
                          <div className="px-4 py-4 text-sm text-slate-500">
                            No products found.
                          </div>
                        ) : (
                          adjustmentProductResults.map((product) => (
                            <button
                              key={product.product_id}
                              type="button"
                              onClick={() => selectAdjustmentProduct(product)}
                              className="block w-full border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50"
                            >
                              <div className="font-semibold text-slate-800">
                                {product.name}
                              </div>

                              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                <span>SKU: {product.sku || "—"}</span>

                                <span>Barcode: {product.barcode || "—"}</span>

                                <span>
                                  Stock: {formatQuantity(product.stock)}{" "}
                                  {product.unit}
                                </span>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}

                {!adjustmentProduct && !adjustmentProductSearch.trim() && (
                  <p className="mt-1.5 text-xs text-slate-400">
                    Search by product name, SKU, or barcode. Press Enter for a
                    barcode scan.
                  </p>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Type
                </label>

                <select
                  value={adjustmentType}
                  onChange={(e) =>
                    setAdjustmentType(
                      e.target.value as "adjustment" | "bad_order",
                    )
                  }
                  disabled={adjustmentLoading}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                >
                  <option value="bad_order">Bad Order</option>
                  <option value="adjustment">Adjustment</option>
                </select>

                <p className="mt-1.5 text-xs text-slate-400">
                  {adjustmentType === "bad_order"
                    ? "Bad Order will deduct the quantity from current stock."
                    : "Adjustment can increase or decrease stock."}
                </p>
              </div>

              {/* Direction */}
              {adjustmentType === "adjustment" && (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Direction
                  </label>

                  <select
                    value={adjustmentDirection}
                    onChange={(e) =>
                      setAdjustmentDirection(
                        e.target.value as "increase" | "decrease",
                      )
                    }
                    disabled={adjustmentLoading}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                  >
                    <option value="increase">Increase</option>
                    <option value="decrease">Decrease</option>
                  </select>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Quantity
                </label>

                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={adjustmentQuantity}
                  onChange={(e) => setAdjustmentQuantity(e.target.value)}
                  disabled={adjustmentLoading}
                  placeholder="Enter quantity"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                />

                {adjustmentProduct && (
                  <p className="mt-1.5 text-xs text-slate-400">
                    Current Stock: {formatQuantity(adjustmentProduct.stock)}{" "}
                    {adjustmentProduct.unit}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-sm font-semibold text-slate-700">
                    Reason / Notes
                  </label>

                  <span className="text-xs text-slate-400">
                    {adjustmentNotes.length}/1000
                  </span>
                </div>

                <textarea
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                  disabled={adjustmentLoading}
                  rows={4}
                  maxLength={1000}
                  placeholder="Enter reason or notes..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={closeAdjustmentModal}
                disabled={adjustmentLoading}
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleAdjustmentSubmit}
                disabled={adjustmentLoading}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {adjustmentLoading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}

                {adjustmentLoading ? "Saving..." : "Save Adjustment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
