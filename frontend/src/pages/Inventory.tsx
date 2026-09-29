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
import InventoryHeader from "../components/inventory/InventoryHeader";
import InventoryFilters from "../components/inventory/InventoryFilters";
import InventorySummaryCards from "../components/inventory/InventorySummaryCards";
import InventoryTable from "../components/inventory/InventoryTable";
import InventoryHistoryModal from "../components/inventory/InventoryHistoryModal";
import ProductDetailsModal from "../components/inventory/ProductDetailsModal";
import AdjustmentModal from "../components/inventory/AdjustmentModal";

import SuccessMessage from "../components/SuccessMessage";

import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";

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
  const [successMessage, setSuccessMessage] = useState("");

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

      const exportParams = {
        search,
        stock_filter: stockFilter,
        product_status: productStatusFilter,
        ...(supplierFilter
          ? {
              supplier_id: Number(supplierFilter),
            }
          : {}),
      } as Parameters<typeof exportInventory>[0];

      let blob: Blob;
      let fileExtension: "xlsx" | "csv" = "xlsx";

      try {
        /*
        |--------------------------------------------------------------------------
        | Standard XLSX Export
        |--------------------------------------------------------------------------
        */

        blob = await exportInventory(exportParams);
      } catch (err) {
        /*
        |--------------------------------------------------------------------------
        | Large Export Detection
        |--------------------------------------------------------------------------
        |
        | Axios receives error responses as Blob because the original request
        | uses responseType: "blob".
        |
        | Therefore we need to inspect the blob contents to determine whether
        | the backend returned the expected 422 preflight response.
        |
        */

        if (err && typeof err === "object" && "response" in err) {
          const response = (
            err as {
              response?: {
                status?: number;
                data?: unknown;
              };
            }
          ).response;

          if (response?.status === 422) {
            let isLargeInventoryExport = false;

            try {
              if (response.data instanceof Blob) {
                const errorText = await response.data.text();

                const errorData = JSON.parse(errorText);

                isLargeInventoryExport = errorData?.csv_available === true;
              }
            } catch {
              isLargeInventoryExport = false;
            }

            if (isLargeInventoryExport) {
              /*
              |--------------------------------------------------------------------------
              | CSV Fallback
              |--------------------------------------------------------------------------
              */

              blob = await exportInventory({
                ...exportParams,
                format: "csv",
              });

              fileExtension = "csv";
            } else {
              throw err;
            }
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Save File
      |--------------------------------------------------------------------------
      */

      const defaultFileName = `inventory-${new Date()
        .toISOString()
        .slice(0, 10)}.${fileExtension}`;

      const filePath = await save({
        title: "Save Inventory Report",
        defaultPath: defaultFileName,
        filters: [
          {
            name:
              fileExtension === "csv" ? "CSV Spreadsheet" : "Excel Spreadsheet",
            extensions: [fileExtension],
          },
        ],
      });

      if (!filePath) {
        return;
      }

      const arrayBuffer = await blob.arrayBuffer();

      await writeFile(filePath, new Uint8Array(arrayBuffer));
    } catch (err) {
      console.error("INVENTORY EXPORT ERROR:", err);

      if (err instanceof Error) {
        console.error("MESSAGE:", err.message);
        console.error("STACK:", err.stack);
      }

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
        adjustmentType === "bad_order" ||
        (adjustmentType === "adjustment" && adjustmentDirection === "decrease")
          ? -quantity
          : quantity;

      await adjustInventory({
        product_id: adjustmentProduct.product_id,
        type: adjustmentType,
        quantity: finalQuantity,
        notes: adjustmentNotes.trim() || undefined,
      });

      setSuccessMessage(
        adjustmentType === "bad_order"
          ? "Bad Order recorded successfully."
          : "Inventory adjustment saved successfully.",
      );

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

      window.setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
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
      <InventoryHeader
        exportLoading={exportLoading}
        loading={loading}
        currentPage={currentPage}
        handleExport={handleExport}
        loadInventory={loadInventory}
      />

      <SuccessMessage
        message={successMessage}
        onClose={() => setSuccessMessage("")}
        title="Inventory Saved"
      />

      {/* Filters */}
      <InventoryFilters
        search={search}
        setSearch={setSearch}
        stockFilter={stockFilter}
        setStockFilter={setStockFilter}
        productStatusFilter={productStatusFilter}
        setProductStatusFilter={setProductStatusFilter}
        supplierFilter={supplierFilter}
        setSupplierFilter={setSupplierFilter}
        suppliers={suppliers}
        suppliersLoading={suppliersLoading}
      />

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

      {/* Summary Cards */}
      <InventorySummaryCards
        inventorySummary={inventorySummary}
        formatQuantity={formatQuantity}
        openHistory={openHistory}
      />

      {/* Inventory Table */}
      <InventoryTable
        inventory={inventory}
        loading={loading}
        total={total}
        from={from}
        to={to}
        currentPage={currentPage}
        lastPage={lastPage}
        goToPage={goToPage}
        openProductDetails={openProductDetails}
        openAdjustmentModal={openAdjustmentModal}
        formatQuantity={formatQuantity}
        formatCurrency={formatCurrency}
        getStockStatus={getStockStatus}
        getProductStatus={getProductStatus}
      />

      {/* Inventory History Modal */}
      <InventoryHistoryModal
        open={historyModalOpen}
        historyType={historyType}
        historyTransactions={historyTransactions}
        historyLoading={historyLoading}
        historyError={historyError}
        historyPage={historyPage}
        historyLastPage={historyLastPage}
        historyTotal={historyTotal}
        closeHistory={closeHistory}
        loadHistory={loadHistory}
        setHistoryPage={setHistoryPage}
        formatDate={formatDate}
        formatQuantity={formatQuantity}
        formatCurrency={formatCurrency}
        formatReference={formatReference}
        getTransactionClass={getTransactionClass}
        getTransactionLabel={getTransactionLabel}
      />

      {/* Product Details / Transaction History Modal */}
      <ProductDetailsModal
        selectedProduct={selectedProduct}
        transactions={transactions}
        transactionsLoading={transactionsLoading}
        transactionsError={transactionsError}
        transactionPage={transactionPage}
        transactionLastPage={transactionLastPage}
        transactionTotal={transactionTotal}
        closeProductDetails={closeProductDetails}
        loadTransactions={loadTransactions}
        setTransactionPage={setTransactionPage}
        formatQuantity={formatQuantity}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        formatReference={formatReference}
        getStockStatus={getStockStatus}
        getTransactionClass={getTransactionClass}
        getTransactionLabel={getTransactionLabel}
      />

      {/* Adjust Inventory Modal */}
      <AdjustmentModal
        open={adjustmentModalOpen}
        adjustmentProduct={adjustmentProduct}
        adjustmentType={adjustmentType}
        adjustmentDirection={adjustmentDirection}
        adjustmentQuantity={adjustmentQuantity}
        adjustmentNotes={adjustmentNotes}
        adjustmentLoading={adjustmentLoading}
        adjustmentError={adjustmentError}
        setAdjustmentType={setAdjustmentType}
        setAdjustmentDirection={setAdjustmentDirection}
        setAdjustmentQuantity={setAdjustmentQuantity}
        setAdjustmentNotes={setAdjustmentNotes}
        closeAdjustmentModal={closeAdjustmentModal}
        handleAdjustmentSubmit={handleAdjustmentSubmit}
        formatQuantity={formatQuantity}
      />
    </div>
  );
}
