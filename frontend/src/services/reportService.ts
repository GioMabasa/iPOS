import api from "./api";

import type {
  ReportPeriod,
  DashboardResponse,
  SalesTrendResponse,
} from "../types/report";
import type { Sale } from "../types/sale";


/*
|--------------------------------------------------------------------------
| Report Parameters
|--------------------------------------------------------------------------
*/

export interface ReportParams {
  period: ReportPeriod;
  from?: string;
  to?: string;
}


/*
|--------------------------------------------------------------------------
| Sales Report Parameters
|--------------------------------------------------------------------------
*/

export interface SalesReportParams extends ReportParams {
  user_id?: number;
  product_id?: number;
  status?: "all" | "completed" | "voided" | "refunded";
  sale_number?: string;
  invoice_number?: string;
  page?: number;
  per_page?: number;
}


/*
|--------------------------------------------------------------------------
| API Response Types
|--------------------------------------------------------------------------
*/

export interface ReportResponse<T = unknown> {
  message: string;
  data: T;
}


/*
|--------------------------------------------------------------------------
| Sales Summary Response
|--------------------------------------------------------------------------
*/

export interface SalesSummary {
  transaction_count: number;
  total_sales: number;
  total_cogs: number;
  gross_profit: number;
  gross_margin: number;
}

export interface SalesSummaryResponse {
  message: string;
  filters?: {
    period?: string;
    from?: string;
    to?: string;
    user_id?: number | null;
    product_id?: number | null;
    status?: string;
    sale_number?: string | null;
    invoice_number?: string | null;
  };
  data: SalesSummary;
}


/*
|--------------------------------------------------------------------------
| Sales Report Pagination
|--------------------------------------------------------------------------
*/

export interface SalesReportPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}


/*
|--------------------------------------------------------------------------
| Paginated Sales Report Response
|--------------------------------------------------------------------------
*/

export interface SalesReportPaginatedResponse<T = unknown> {
  message: string;
  filters?: {
    period?: string;
    from?: string;
    to?: string;
    user_id?: number | null;
    product_id?: number | null;
    status?: string;
    sale_number?: string | null;
    invoice_number?: string | null;
  };
  data: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    data: T[];
  };
}


/*
|--------------------------------------------------------------------------
| Build Query Parameters
|--------------------------------------------------------------------------
*/

function buildParams(
  params: ReportParams | SalesReportParams,
): Record<string, string> {

  const query: Record<string, string> = {
    period: params.period,
  };


  if (
    params.period === "custom" &&
    params.from
  ) {
    query.from = params.from;
  }


  if (
    params.period === "custom" &&
    params.to
  ) {
    query.to = params.to;
  }


  if ("user_id" in params && params.user_id !== undefined) {
    query.user_id = String(params.user_id);
  }


  if ("product_id" in params && params.product_id !== undefined) {
    query.product_id = String(params.product_id);
  }


  if ("status" in params && params.status) {
    query.status = params.status;
  }


  if ("sale_number" in params && params.sale_number) {
    query.sale_number = params.sale_number;
  }


  if ("invoice_number" in params && params.invoice_number) {
    query.invoice_number = params.invoice_number;
  }


  if ("page" in params && params.page !== undefined) {
    query.page = String(params.page);
  }


  if ("per_page" in params && params.per_page !== undefined) {
    query.per_page = String(params.per_page);
  }


  return query;
}


/*
|--------------------------------------------------------------------------
| Dashboard Report
|--------------------------------------------------------------------------
*/

export async function getDashboardReport(
  params: ReportParams,
): Promise<DashboardResponse> {

  const response =
    await api.get<DashboardResponse>(
      "/reports/dashboard",
      {
        params: buildParams(params),
      },
    );


  return response.data;
}


/*
|--------------------------------------------------------------------------
| Sales Summary
|--------------------------------------------------------------------------
*/

export async function getSalesSummary(
  params: SalesReportParams,
): Promise<SalesSummaryResponse> {

  const response =
    await api.get<SalesSummaryResponse>(
      "/reports/sales/summary",
      {
        params: buildParams(params),
      },
    );


  return response.data;
}


/*
|--------------------------------------------------------------------------
| Detailed Sales Report
|--------------------------------------------------------------------------
*/

export async function getSalesReport(
  params: SalesReportParams,
): Promise<SalesReportPaginatedResponse<Sale>> {
  const response =
    await api.get<SalesReportPaginatedResponse<Sale>>(
      "/reports/sales",
      {
        params: buildParams(params),
      },
    );

  return response.data;
}


/*
|--------------------------------------------------------------------------
| Product Sales Report
|--------------------------------------------------------------------------
*/

export async function getProductSalesReport(
  params: ReportParams,
): Promise<ReportResponse> {

  const response =
    await api.get<ReportResponse>(
      "/reports/product-sales",
      {
        params: buildParams(params),
      },
    );


  return response.data;
}


/*
|--------------------------------------------------------------------------
| Top Selling Products
|--------------------------------------------------------------------------
*/

export async function getTopSellingProducts(
  params: ReportParams,
): Promise<ReportResponse> {

  const response =
    await api.get<ReportResponse>(
      "/reports/top-selling-products",
      {
        params: buildParams(params),
      },
    );


  return response.data;
}


/*
|--------------------------------------------------------------------------
| Low Stock Report
|--------------------------------------------------------------------------
|
| Low stock is based on current inventory.
| It does not require a date period.
|--------------------------------------------------------------------------
*/

export async function getLowStockReport(): Promise<ReportResponse> {

  const response =
    await api.get<ReportResponse>(
      "/reports/low-stock",
    );


  return response.data;
}


/*
|--------------------------------------------------------------------------
| Inventory Movement Report
|--------------------------------------------------------------------------
*/

export async function getInventoryMovementReport(
  params: ReportParams,
): Promise<ReportResponse> {

  const response =
    await api.get<ReportResponse>(
      "/reports/inventory-movement",
      {
        params: buildParams(params),
      },
    );


  return response.data;
}


/*
|--------------------------------------------------------------------------
| Void / Refund Report
|--------------------------------------------------------------------------
*/

export async function getVoidRefundReport(
  params: ReportParams,
): Promise<ReportResponse> {

  const response =
    await api.get<ReportResponse>(
      "/reports/void-refund",
      {
        params: buildParams(params),
      },
    );


  return response.data;
}


/*
|--------------------------------------------------------------------------
| Sales Trend
|--------------------------------------------------------------------------
*/

export async function getSalesTrend(
  params: ReportParams,
): Promise<SalesTrendResponse> {

  const response =
    await api.get<SalesTrendResponse>(
      "/reports/sales-trend",
      {
        params: buildParams(params),
      },
    );


  return response.data;
}


/*
|--------------------------------------------------------------------------
| Daily Sales
|--------------------------------------------------------------------------
*/

export async function getDailySales(): Promise<ReportResponse> {

  const response =
    await api.get<ReportResponse>(
      "/reports/daily",
    );


  return response.data;
}

