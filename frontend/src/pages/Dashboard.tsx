import { useEffect, useState } from "react";

import { getDashboardReport, getSalesTrend } from "../services/reportService";

import SalesOverview from "../components/dashboard/SalesOverview";
import SalesTrend from "../components/dashboard/SalesTrend";
import TopSellingProducts from "../components/dashboard/TopSellingProducts";
import InventoryMovement from "../components/dashboard/InventoryMovement";
import LowStockProducts from "../components/dashboard/LowStockProducts";
import VoidRefund from "../components/dashboard/VoidRefund";

import { useAuth } from "../context/AuthContext";

import type {
  DashboardData,
  ReportPeriod,
  SalesTrendItem,
} from "../types/report";

/*
|--------------------------------------------------------------------------
| Empty Dashboard
|--------------------------------------------------------------------------
*/

const emptyDashboard: DashboardData = {
  sales: {
    transaction_count: 0,
    total_sales: 0,
    total_cogs: 0,
    gross_profit: 0,
    gross_margin: 0,
  },

  inventory: {
    transaction_count: 0,
    total_in: 0,
    total_out: 0,
    net_movement: 0,
    purchases: 0,
    sales: 0,
    refunds: 0,
    voids: 0,
    bad_orders: 0,
    adjustment_in: 0,
    adjustment_out: 0,
  },

  low_stock: [],

  top_products: [],

  void_refund: [],
};

/*
|--------------------------------------------------------------------------
| Dashboard
|--------------------------------------------------------------------------
*/

export default function Dashboard() {
  /*
  |--------------------------------------------------------------------------
  | Auth
  |--------------------------------------------------------------------------
  */

  const { user } = useAuth();

  const isCashier = user?.role === "cashier";

  /*
  |--------------------------------------------------------------------------
  | State
  |--------------------------------------------------------------------------
  */

  const [period, setPeriod] = useState<ReportPeriod>("today");

  const [salesTrendPeriod] = useState<ReportPeriod>("this_month");

  const [topProductsPeriod] = useState<ReportPeriod>("this_month");

  const [from, setFrom] = useState("");

  const [to, setTo] = useState("");

  const [dashboard, setDashboard] = useState<DashboardData>(emptyDashboard);

  const [salesTrend, setSalesTrend] = useState<SalesTrendItem[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Load Dashboard
  |--------------------------------------------------------------------------
  */

  async function loadDashboard(
    selectedPeriod: ReportPeriod,
    customFrom?: string,
    customTo?: string,
  ) {
    try {
      setLoading(true);

      setError("");

      const params = {
        period: selectedPeriod,

        top_products_period: topProductsPeriod,

        ...(selectedPeriod === "custom"
          ? {
              from: customFrom ?? from,

              to: customTo ?? to,
            }
          : {}),
      };

      const salesTrendParams = {
        period: salesTrendPeriod,
      };

      const [dashboardResponse, salesTrendResponse] = await Promise.all([
        getDashboardReport(params),

        getSalesTrend(salesTrendParams),
      ]);

      setDashboard(dashboardResponse.data);

      setSalesTrend(salesTrendResponse.data);
    } catch (err) {
      console.error("Dashboard loading error:", err);

      setError("Unable to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Automatic Period Loading
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (period !== "custom") {
      loadDashboard(period);
    }
  }, [period]);

  /*
  |--------------------------------------------------------------------------
  | Period Change
  |--------------------------------------------------------------------------
  */

  function handlePeriodChange(value: string) {
    const selectedPeriod = value as ReportPeriod;

    setPeriod(selectedPeriod);

    setError("");

    if (selectedPeriod !== "custom") {
      setFrom("");

      setTo("");
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Apply Custom Period
  |--------------------------------------------------------------------------
  */

  function handleCustomApply() {
    setError("");

    if (!from || !to) {
      setError("Please select both From and To dates.");

      return;
    }

    if (from > to) {
      setError("The From date cannot be later than the To date.");

      return;
    }

    loadDashboard("custom", from, to);
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* ==========================================================
          STICKY HEADER
      ========================================================== */}

      <div className="sticky top-0 z-30 -mx-4 -mt-4 mb-7 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:-mx-6 sm:-mt-6 sm:px-6 lg:-mx-8 lg:-mt-8 lg:px-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          {/* ========================================================
              TITLE
          ======================================================== */}

          <div>
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
                    d="M3 13.5 9 7l4 4 8-8"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 7v5h-5"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 19h16"
                  />
                </svg>
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Dashboard
                </h1>

                <p className="mt-0.5 text-sm text-slate-500">
                  Overview of your POS performance.
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================
              REPORT FILTER
          ======================================================== */}

          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              {/* PERIOD */}

              <div>
                <label
                  htmlFor="report-period"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Report Period
                </label>

                <select
                  id="report-period"
                  value={period}
                  onChange={(event) => handlePeriodChange(event.target.value)}
                  className="h-10 w-full min-w-[190px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                >
                  <option value="today">Today</option>

                  <option value="yesterday">Yesterday</option>

                  <option value="this_week">This Week</option>

                  <option value="this_month">This Month</option>

                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* ======================================================
                  CUSTOM DATES
              ====================================================== */}

              {period === "custom" && (
                <>
                  {/* FROM */}

                  <div>
                    <label
                      htmlFor="report-from"
                      className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      From
                    </label>

                    <input
                      id="report-from"
                      type="date"
                      value={from}
                      onChange={(event) => setFrom(event.target.value)}
                      className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>

                  {/* TO */}

                  <div>
                    <label
                      htmlFor="report-to"
                      className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      To
                    </label>

                    <input
                      id="report-to"
                      type="date"
                      value={to}
                      onChange={(event) => setTo(event.target.value)}
                      className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>

                  {/* APPLY */}

                  <button
                    type="button"
                    onClick={handleCustomApply}
                    disabled={loading}
                    className="flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
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
                        d="M5 12h14"
                      />

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m13 6 6 6-6 6"
                      />
                    </svg>
                    Apply
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================================
          ERROR
      ========================================================== */}

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700 shadow-sm">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4" />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 17h.01"
              />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.3 3.6 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"
              />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-medium text-red-800">{error}</p>
          </div>

          <button
            type="button"
            onClick={() => loadDashboard(period, from, to)}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      {/* ==========================================================
          CONTENT
      ========================================================== */}

      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
            </div>

            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">
                Loading dashboard
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Please wait while we load your reports...
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-7">
          {/* ======================================================
              SALES OVERVIEW
          ====================================================== */}

          <SalesOverview sales={dashboard.sales} />

          {/* ======================================================
              SALES TREND
          ====================================================== */}

          {!isCashier && <SalesTrend data={salesTrend} />}

          {/* ======================================================
              TOP SELLING PRODUCTS + LOW STOCK
          ====================================================== */}

          {!isCashier && (
            <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
              {/* ====================================================
                  TOP SELLING PRODUCTS
              ==================================================== */}

              <TopSellingProducts products={dashboard.top_products} />

              {/* ====================================================
                  LOW STOCK
              ==================================================== */}

              <LowStockProducts products={dashboard.low_stock} />
            </div>
          )}

          {/* ======================================================
              INVENTORY MOVEMENT
          ====================================================== */}

          {!isCashier && <InventoryMovement inventory={dashboard.inventory} />}

          {/* ======================================================
              VOID & REFUND
          ====================================================== */}

          <VoidRefund data={dashboard.void_refund} />
        </div>
      )}
    </div>
  );
}
