import { useState } from "react";
import type { SalesTrendItem } from "../../types/report";

interface SalesTrendChartProps {
  data: SalesTrendItem[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-PH").format(Number(value) || 0);
}

function formatDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);

  return parsed.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
}

export default function SalesTrendChart({ data }: SalesTrendChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="flex h-80 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-indigo-50/50">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-6 w-6"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />

            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m7 15 3-3 3 2 5-6"
            />
          </svg>
        </div>

        <p className="mt-4 text-sm font-semibold text-slate-700">
          No sales data
        </p>

        <p className="mt-1 text-xs text-slate-400">
          No sales data for this period.
        </p>
      </div>
    );
  }

  const width = 900;
  const height = 340;

  const paddingLeft = 75;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 60;

  const chartWidth = width - paddingLeft - paddingRight;

  const chartHeight = height - paddingTop - paddingBottom;

  /*
  |--------------------------------------------------------------------------
  | Period Sales
  |--------------------------------------------------------------------------
  */

  const totalSales = data.reduce(
    (total, item) => total + Number(item.sales),
    0,
  );

  /*
  |--------------------------------------------------------------------------
  | Transactions
  |--------------------------------------------------------------------------
  */

  const totalTransactions = data.reduce(
    (total, item) => total + Number(item.transaction_count),
    0,
  );

  /*
  |--------------------------------------------------------------------------
  | Chart Scale
  |--------------------------------------------------------------------------
  */

  const maxSales = Math.max(...data.map((item) => Number(item.sales)), 0);

  const chartMax = maxSales > 0 ? Math.ceil(maxSales * 1.15) : 100;

  const getX = (index: number) => {
    if (data.length === 1) {
      return paddingLeft + chartWidth / 2;
    }

    return paddingLeft + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (sales: number) => {
    return paddingTop + chartHeight - (sales / chartMax) * chartHeight;
  };

  const points = data.map((item, index) => ({
    x: getX(index),
    y: getY(Number(item.sales)),
  }));

  /*
  |--------------------------------------------------------------------------
  | Line
  |--------------------------------------------------------------------------
  */

  const linePath = points
    .map((point, index) =>
      index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`,
    )
    .join(" ");

  /*
  |--------------------------------------------------------------------------
  | Area
  |--------------------------------------------------------------------------
  */

  const areaPath =
    points.length > 0
      ? `
        ${linePath}
        L ${points[points.length - 1].x}
          ${paddingTop + chartHeight}
        L ${points[0].x}
          ${paddingTop + chartHeight}
        Z
      `
      : "";

  /*
  |--------------------------------------------------------------------------
  | Grid
  |--------------------------------------------------------------------------
  */

  const gridLines = 4;

  const yAxisValues = Array.from(
    {
      length: gridLines + 1,
    },
    (_, index) => (chartMax / gridLines) * (gridLines - index),
  );

  /*
  |--------------------------------------------------------------------------
  | X Axis Labels
  |--------------------------------------------------------------------------
  */

  const maxLabels = 6;

  const labelStep =
    data.length <= maxLabels ? 1 : Math.ceil(data.length / maxLabels);

  const activeItem = activeIndex !== null ? data[activeIndex] : null;

  return (
    <div className="w-full">
      {/* ==========================================================
          SUMMARY
      ========================================================== */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* PERIOD SALES */}

        <div className="group relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-indigo-100/60 transition duration-300 group-hover:scale-110" />

          <div className="relative flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                Period Sales
              </p>

              <p className="mt-1.5 text-xl font-bold tracking-tight text-slate-900">
                {formatCurrency(totalSales)}
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm transition duration-200 group-hover:scale-105 group-hover:bg-indigo-700">
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
              </svg>
            </div>
          </div>

          <p className="relative mt-3 border-t border-indigo-100/80 pt-3 text-xs font-medium text-indigo-600/80">
            Total revenue for the current month.
          </p>
        </div>

        {/* TRANSACTIONS */}

        <div className="group relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-100/60 transition duration-300 group-hover:scale-110" />

          <div className="relative flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Transactions
              </p>

              <p className="mt-1.5 text-xl font-bold tracking-tight text-slate-900">
                {formatNumber(totalTransactions)}
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition duration-200 group-hover:scale-105 group-hover:bg-blue-700">
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
                  d="M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7h8M8 11h8M8 15h5"
                />
              </svg>
            </div>
          </div>

          <p className="relative mt-3 border-t border-blue-100/80 pt-3 text-xs font-medium text-blue-600/80">
            Completed sales for the current month.
          </p>
        </div>
      </div>

      {/* ==========================================================
          CHART
      ========================================================== */}

      <div className="overflow-x-auto rounded-2xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/20 to-violet-50/30 shadow-sm">
        <div
          className="relative min-w-[700px]"
          style={{
            aspectRatio: `${width} / ${height}`,
          }}
        >
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-full w-full"
            role="img"
            aria-label="Sales trend chart"
          >
            {/* ==================================================
                GRADIENT
            ================================================== */}

            <defs>
              <linearGradient
                id="salesTrendAreaGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  className="text-indigo-500"
                  stopColor="currentColor"
                  stopOpacity="0.24"
                />

                <stop
                  offset="55%"
                  className="text-violet-500"
                  stopColor="currentColor"
                  stopOpacity="0.10"
                />

                <stop
                  offset="100%"
                  className="text-violet-500"
                  stopColor="currentColor"
                  stopOpacity="0.01"
                />
              </linearGradient>
            </defs>

            {/* ==================================================
                GRID
            ================================================== */}

            {yAxisValues.map((value, index) => {
              const y = getY(value);

              return (
                <g key={`grid-${index}`}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    className="stroke-indigo-100/70"
                    strokeWidth="1"
                  />

                  <text
                    x={paddingLeft - 14}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-slate-400 text-[11px]"
                  >
                    {formatCurrency(value)}
                  </text>
                </g>
              );
            })}

            {/* ==================================================
                BASELINE
            ================================================== */}

            <line
              x1={paddingLeft}
              y1={paddingTop + chartHeight}
              x2={width - paddingRight}
              y2={paddingTop + chartHeight}
              className="stroke-indigo-200"
              strokeWidth="1"
            />

            {/* ==================================================
                AREA
            ================================================== */}

            <path
              d={areaPath}
              fill="url(#salesTrendAreaGradient)"
              stroke="none"
            />

            {/* ==================================================
                LINE
            ================================================== */}

            {points.length > 1 && (
              <path
                d={linePath}
                fill="none"
                className="stroke-indigo-600"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* ==================================================
                POINTS
            ================================================== */}

            {points.map((point, index) => {
              const isActive = activeIndex === index;

              return (
                <g
                  key={data[index].date}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className="cursor-pointer"
                >
                  {/* Hover area */}

                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="12"
                    className="fill-transparent"
                  />

                  {isActive && (
                    <>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="11"
                        className="fill-indigo-100/80"
                      />

                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="8"
                        className="fill-violet-100"
                      />

                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="6"
                        className="fill-white stroke-indigo-500"
                        strokeWidth="2.5"
                      />
                    </>
                  )}

                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isActive ? 4.5 : 3.5}
                    className="fill-white stroke-indigo-600"
                    strokeWidth="2.5"
                  />
                </g>
              );
            })}

            {/* ==================================================
                X AXIS LABELS
            ================================================== */}

            {data.map((item, index) => {
              if (index % labelStep !== 0 && index !== data.length - 1) {
                return null;
              }

              return (
                <text
                  key={`label-${item.date}`}
                  x={getX(index)}
                  y={height - 22}
                  textAnchor="middle"
                  className="fill-slate-400 text-[11px]"
                >
                  {formatDate(item.date)}
                </text>
              );
            })}
          </svg>

          {/* ======================================================
              TOOLTIP
          ====================================================== */}

          {activeItem && activeIndex !== null && (
            <div
              className="pointer-events-none absolute z-10 w-52 -translate-x-1/2 -translate-y-[calc(100%+12px)] overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-xl shadow-indigo-100/40"
              style={{
                left: `${(points[activeIndex].x / width) * 100}%`,

                top: `${(points[activeIndex].y / height) * 100}%`,
              }}
            >
              <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-3.5 py-2.5">
                <p className="text-xs font-semibold text-indigo-700">
                  {formatDate(activeItem.date)}
                </p>
              </div>

              <div className="px-3.5 py-3">
                <p className="text-xs font-medium text-slate-500">
                  Daily Sales
                </p>

                <p className="mt-1 text-lg font-bold tracking-tight text-indigo-700">
                  {formatCurrency(Number(activeItem.sales))}
                </p>

                <div className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-2">
                  <div className="h-2 w-2 rounded-full bg-indigo-600" />

                  <p className="text-xs text-slate-500">
                    {formatNumber(Number(activeItem.transaction_count))}{" "}
                    transaction
                    {activeItem.transaction_count !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==========================================================
          CHART FOOTER
      ========================================================== */}

      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
        <span className="h-2 w-2 rounded-full bg-indigo-600 shadow-sm shadow-indigo-200" />

        <span>Daily sales</span>

        <span className="text-slate-300">•</span>

        <span>Hover over a point for details</span>
      </div>
    </div>
  );
}
