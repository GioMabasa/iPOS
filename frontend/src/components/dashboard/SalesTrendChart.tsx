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
      <div className="flex h-80 items-center justify-center text-sm text-gray-500">
        No sales data for this period.
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

  const maxLabels = 8;

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

        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Period Sales
          </p>

          <p className="mt-1 text-lg font-bold text-gray-900">
            {formatCurrency(totalSales)}
          </p>
        </div>

        {/* TRANSACTIONS */}

        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Transactions
          </p>

          <p className="mt-1 text-lg font-bold text-gray-900">
            {totalTransactions}
          </p>
        </div>
      </div>

      {/* ==========================================================
          CHART
      ========================================================== */}

      <div className="overflow-x-auto">
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
                    className="stroke-gray-100"
                    strokeWidth="1"
                  />

                  <text
                    x={paddingLeft - 12}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-gray-400 text-[12px]"
                  >
                    {formatCurrency(value)}
                  </text>
                </g>
              );
            })}

            {/* ==================================================
                AREA
            ================================================== */}

            <path d={areaPath} className="fill-indigo-50" />

            {/* ==================================================
                LINE
            ================================================== */}

            {points.length > 1 && (
              <path
                d={linePath}
                fill="none"
                className="stroke-indigo-600"
                strokeWidth="3"
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
                  {isActive && (
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="9"
                      className="fill-indigo-100"
                    />
                  )}

                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isActive ? 5 : 4}
                    className="fill-white stroke-indigo-600"
                    strokeWidth="3"
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
                  className="fill-gray-400 text-[12px]"
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
              className="pointer-events-none absolute z-10 w-48 -translate-x-1/2 -translate-y-full rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
              style={{
                left: `${(points[activeIndex].x / width) * 100}%`,

                top: `${(points[activeIndex].y / height) * 100}%`,
              }}
            >
              <p className="text-xs font-medium text-gray-500">
                {formatDate(activeItem.date)}
              </p>

              <p className="mt-1 text-base font-bold text-gray-900">
                {formatCurrency(Number(activeItem.sales))}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {activeItem.transaction_count} transaction
                {activeItem.transaction_count !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
