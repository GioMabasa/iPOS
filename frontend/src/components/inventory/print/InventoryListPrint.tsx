import type {
  InventoryProduct,
  InventorySummary,
} from "../../../types/inventory";

import { printInventoryDocument } from "../../../services/printerService";

interface InventoryListPrintProps {
  products: InventoryProduct[];
  summary: InventorySummary;
  search: string;
  stockFilter: "all" | "in_stock" | "low_stock" | "out_of_stock";
  productStatusFilter: "all" | "active" | "inactive";
  supplierName?: string;
}

const escapeHtml = (value: unknown) => {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const formatQuantity = (value: number | string) => {
  return Number(value).toLocaleString("en-PH", {
    maximumFractionDigits: 3,
  });
};

const formatCurrency = (value: number | string) => {
  return `₱${Number(value).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const getStockStatus = (product: InventoryProduct) => {
  const stock = Number(product.stock);

  if (stock <= 0) {
    return "Out of Stock";
  }

  if (product.is_low_stock) {
    return "Low Stock";
  }

  return "In Stock";
};

const getProductStatus = (product: InventoryProduct) => {
  return product.is_active ? "Active" : "Inactive";
};

const getFilterLabel = (value: string, labels: Record<string, string>) => {
  return labels[value] ?? value;
};

export function buildInventoryListPrintHtml({
  products,
  summary,
  search,
  stockFilter,
  productStatusFilter,
  supplierName,
}: InventoryListPrintProps) {
  const reportDate = new Date().toLocaleString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const stockFilterLabel = getFilterLabel(stockFilter, {
    all: "All",
    in_stock: "In Stock",
    low_stock: "Low Stock",
    out_of_stock: "Out of Stock",
  });

  const productStatusFilterLabel = getFilterLabel(productStatusFilter, {
    all: "All",
    active: "Active",
    inactive: "Inactive",
  });

  const hasFilters =
    Boolean(search.trim()) ||
    stockFilter !== "all" ||
    productStatusFilter !== "all" ||
    Boolean(supplierName);

  const filterRows = hasFilters
    ? `
        <div class="filters">
          <div class="filter-title">Applied Filters</div>

          ${
            search.trim()
              ? `
                <div class="filter-item">
                  <span class="filter-label">Search</span>
                  <span>${escapeHtml(search.trim())}</span>
                </div>
              `
              : ""
          }

          ${
            stockFilter !== "all"
              ? `
                <div class="filter-item">
                  <span class="filter-label">Stock Status</span>
                  <span>${escapeHtml(stockFilterLabel)}</span>
                </div>
              `
              : ""
          }

          ${
            productStatusFilter !== "all"
              ? `
                <div class="filter-item">
                  <span class="filter-label">Product Status</span>
                  <span>${escapeHtml(productStatusFilterLabel)}</span>
                </div>
              `
              : ""
          }

          ${
            supplierName
              ? `
                <div class="filter-item">
                  <span class="filter-label">Supplier</span>
                  <span>${escapeHtml(supplierName)}</span>
                </div>
              `
              : ""
          }
        </div>
      `
    : `
        <div class="filters">
          <div class="filter-title">Applied Filters</div>

          <div class="filter-item">
            <span class="filter-label">Status</span>
            <span>All Products</span>
          </div>
        </div>
      `;

  const summaryCards = `
    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-label">Total Products</div>
        <div class="summary-value">
          ${summary.total_products.toLocaleString("en-PH")}
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-label">Total Stock</div>
        <div class="summary-value">
          ${formatQuantity(summary.total_stock)}
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-label">Low Stock</div>
        <div class="summary-value warning">
          ${summary.low_stock.toLocaleString("en-PH")}
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-label">Out of Stock</div>
        <div class="summary-value danger">
          ${summary.out_of_stock.toLocaleString("en-PH")}
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-label">Bad Orders</div>
        <div class="summary-value danger">
          ${formatQuantity(summary.bad_orders)}
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-label">Adjustments</div>
        <div class="summary-value">
          ${formatQuantity(summary.adjustments)}
        </div>
      </div>
    </div>
  `;

  const tableRows =
    products.length > 0
      ? products
          .map(
            (product) => `
              <tr>
                <td class="product-cell">
                  <div class="product-name">
                    ${escapeHtml(product.name)}
                  </div>
                </td>

                <td>
                  ${escapeHtml(product.sku || "—")}
                </td>

                <td>
                  ${escapeHtml(product.barcode || "—")}
                </td>

                <td>
                  ${escapeHtml(product.supplier || "—")}
                </td>

                <td class="number">
                  ${formatQuantity(product.minimum_stock)}
                </td>

                <td class="number stock-value">
                  ${formatQuantity(product.stock)}
                </td>

                <td>
                  ${escapeHtml(product.unit)}
                </td>

                <td class="number">
                  ${formatCurrency(product.stock_value)}
                </td>

                <td class="number">
                  ${formatCurrency(product.cost)}
                </td>

                <td class="number">
                  ${formatCurrency(product.selling_price)}
                </td>

                <td>
                  <span class="status">
                    ${escapeHtml(getStockStatus(product))}
                  </span>
                </td>

                <td>
                  <span class="status">
                    ${escapeHtml(getProductStatus(product))}
                  </span>
                </td>
              </tr>
            `,
          )
          .join("")
      : `
          <tr>
            <td colspan="12" class="empty">
              No inventory records found.
            </td>
          </tr>
        `;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />

        <style>
          @page {
            size: A4 portrait;
            margin: 12mm;
          }

          * {
            box-sizing: border-box;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            width: 100%;
          }

          body {
            background: #ffffff;
            font-family: Arial, Helvetica, sans-serif;
            color: #111827;
            font-size: 9px;
            line-height: 1.35;
          }

          .document {
            width: 100%;
            max-width: 100%;
            margin: 0 auto;
            padding: 0;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            width: 100%;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 8px;
          }

          .brand {
            flex: 1;
            min-width: 0;
          }

          .company-name {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
            margin: 0;
          }

          .company-tagline {
            margin-top: 2px;
            color: #64748b;
            font-size: 9px;
          }

          .system-name {
            flex: 0 0 auto;
            max-width: 65mm;
            text-align: right;
            font-size: 10px;
            font-weight: 700;
            color: #334155;
          }

          .title-section {
            margin-top: 10px;
          }

          .report-title {
            margin: 0;
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
          }

          .report-date {
            margin-top: 2px;
            color: #64748b;
            font-size: 9px;
          }

          .filters {
            margin-top: 9px;
            padding: 7px 9px;
            border: 1px solid #cbd5e1;
            border-radius: 5px;
            background: #f8fafc;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .filter-title {
            margin-bottom: 4px;
            font-size: 9px;
            font-weight: 700;
            color: #334155;
            text-transform: uppercase;
          }

          .filter-item {
            display: inline-block;
            margin-right: 16px;
            color: #334155;
          }

          .filter-label {
            margin-right: 4px;
            font-weight: 700;
          }

          .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 5px;
            margin-top: 9px;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .summary-card {
            border: 1px solid #cbd5e1;
            border-radius: 5px;
            padding: 6px 7px;
            background: #ffffff;
          }

          .summary-label {
            color: #64748b;
            font-size: 8px;
            font-weight: 600;
          }

          .summary-value {
            margin-top: 2px;
            color: #0f172a;
            font-size: 13px;
            font-weight: 700;
          }

          .summary-value.warning {
            color: #b45309;
          }

          .summary-value.danger {
            color: #dc2626;
          }

          .table-section {
            width: 100%;
            margin-top: 10px;
          }

          table {
            width: 100%;
            max-width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }

          thead {
            display: table-header-group;
          }

          th {
            padding: 5px 3px;
            border: 1px solid #94a3b8;
            background: #e2e8f0;
            color: #0f172a;
            font-size: 7.2px;
            font-weight: 700;
            text-align: left;
            vertical-align: middle;
            overflow-wrap: anywhere;
          }

          td {
            padding: 4px 3px;
            border: 1px solid #cbd5e1;
            color: #334155;
            font-size: 7.2px;
            vertical-align: middle;
            overflow-wrap: anywhere;
            word-break: normal;
          }

          tbody tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .product-cell {
            font-weight: 600;
          }

          .product-name {
            color: #0f172a;
            font-weight: 700;
          }

          .number {
            text-align: right;
            white-space: nowrap;
          }

          .stock-value {
            font-weight: 700;
            color: #0f172a;
          }

          .status {
            display: inline;
            font-size: 6.8px;
            font-weight: 600;
          }

          .empty {
            padding: 20px;
            text-align: center;
            color: #64748b;
          }

          .footer {
            margin-top: 10px;
            padding-top: 6px;
            border-top: 1px solid #cbd5e1;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            width: 100%;
            color: #64748b;
            font-size: 7.5px;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .footer-right {
            text-align: right;
          }
        </style>
      </head>

      <body>
        <div class="document">

          <div class="header">
            <div class="brand">
              <div class="company-name">
                GioTechWorks
              </div>

              <div class="company-tagline">
                Software &amp; Business Solutions
              </div>
            </div>

            <div class="system-name">
              iPOS<br />
              Integrated Point of Sale &amp; Inventory System
            </div>
          </div>

          <div class="title-section">
            <h1 class="report-title">
              INVENTORY LIST
            </h1>

            <div class="report-date">
              Generated: ${escapeHtml(reportDate)}
            </div>
          </div>

          ${filterRows}

          ${summaryCards}

          <div class="table-section">
            <table>
              <colgroup>
                <col style="width: 14%" />
                <col style="width: 7%" />
                <col style="width: 9%" />
                <col style="width: 10%" />
                <col style="width: 6%" />
                <col style="width: 6%" />
                <col style="width: 5%" />
                <col style="width: 9%" />
                <col style="width: 8%" />
                <col style="width: 8%" />
                <col style="width: 9%" />
                <col style="width: 9%" />
              </colgroup>

              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Barcode</th>
                  <th>Supplier</th>
                  <th>Min. Stock</th>
                  <th>Stock</th>
                  <th>Unit</th>
                  <th>Stock Value</th>
                  <th>Cost</th>
                  <th>Selling Price</th>
                  <th>Stock Status</th>
                  <th>Product Status</th>
                </tr>
              </thead>

              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <div>
              iPOS — Integrated Point of Sale &amp; Inventory System
            </div>

            <div class="footer-right">
              Developed by GioTechWorks
            </div>
          </div>

        </div>
      </body>
    </html>
  `;
}

export async function printInventoryList(props: InventoryListPrintProps) {
  const html = buildInventoryListPrintHtml(props);

  return await printInventoryDocument(html);
}

export default function InventoryListPrint() {
  return null;
}
