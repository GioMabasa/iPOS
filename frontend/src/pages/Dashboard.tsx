import { useEffect, useState } from "react";

import { getDashboardReport, getSalesTrend } from "../services/reportService";

import SalesOverview from "../components/dashboard/SalesOverview";
import SalesTrend from "../components/dashboard/SalesTrend";
import TopSellingProducts from "../components/dashboard/TopSellingProducts";
import InventoryMovement from "../components/dashboard/InventoryMovement";
import LowStockProducts from "../components/dashboard/LowStockProducts";
import VoidRefund from "../components/dashboard/VoidRefund";

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
  | State
  |--------------------------------------------------------------------------
  */

  const [period, setPeriod] = useState<ReportPeriod>("today");

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

        ...(selectedPeriod === "custom"
          ? {
              from: customFrom ?? from,

              to: customTo ?? to,
            }
          : {}),
      };

      const [dashboardResponse, salesTrendResponse] = await Promise.all([
        getDashboardReport(params),

        getSalesTrend(params),
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
    <div className="min-h-full bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* ==========================================================
          HEADER
      ========================================================== */}

      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        {/* TITLE */}

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Overview of your POS performance.
          </p>
        </div>

        {/* ========================================================
            REPORT FILTER
        ======================================================== */}

        <div className="flex flex-col gap-3">
          <div>
            <label
              htmlFor="report-period"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Report Period
            </label>

            <select
              id="report-period"
              value={period}
              onChange={(event) => handlePeriodChange(event.target.value)}
              className="h-10 w-full min-w-[190px] rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              {/* FROM */}

              <div>
                <label
                  htmlFor="report-from"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  From
                </label>

                <input
                  id="report-from"
                  type="date"
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                  className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* TO */}

              <div>
                <label
                  htmlFor="report-to"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  To
                </label>

                <input
                  id="report-to"
                  type="date"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                  className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* APPLY */}

              <button
                type="button"
                onClick={handleCustomApply}
                disabled={loading}
                className="h-10 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ==========================================================
          ERROR
      ========================================================== */}

      {error && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => loadDashboard(period, from, to)}
            className="font-semibold underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* ==========================================================
          CONTENT
      ========================================================== */}

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
            Loading dashboard...
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ======================================================
              SALES OVERVIEW
          ====================================================== */}

          <SalesOverview sales={dashboard.sales} />

          {/* ======================================================
              SALES TREND
          ====================================================== */}

          <SalesTrend data={salesTrend} />

          {/* ======================================================
              TOP SELLING PRODUCTS
          ====================================================== */}

          <TopSellingProducts products={dashboard.top_products} />

          {/* ======================================================
              INVENTORY MOVEMENT
          ====================================================== */}

          <InventoryMovement inventory={dashboard.inventory} />

          {/* ======================================================
              LOW STOCK
          ====================================================== */}

          <LowStockProducts products={dashboard.low_stock} />

          {/* ======================================================
              VOID & REFUND
          ====================================================== */}

          <VoidRefund data={dashboard.void_refund} />
        </div>
      )}
    </div>
  );
}
