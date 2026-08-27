import api from "./api";

import type {
  ReportPeriod,
  DashboardResponse,
  SalesTrendResponse,
} from "../types/report";


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
| API Response Types
|--------------------------------------------------------------------------
|
| These are intentionally lightweight for reports where the complete
| response interface is not required by the dashboard yet.
|--------------------------------------------------------------------------
*/

export interface ReportResponse<T = unknown> {
  message: string;
  data: T;
}


/*
|--------------------------------------------------------------------------
| Build Query Parameters
|--------------------------------------------------------------------------
*/

function buildParams(
  params: ReportParams,
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
  params: ReportParams,
): Promise<ReportResponse> {

  const response =
    await api.get<ReportResponse>(
      "/reports/sales-summary",
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
  params: ReportParams,
): Promise<ReportResponse> {

  const response =
    await api.get<ReportResponse>(
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

