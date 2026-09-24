import type { SalesTrendItem } from "../../types/report";
import SalesTrendChart from "./SalesTrendChart";

interface SalesTrendProps {
  data: SalesTrendItem[];
}

export default function SalesTrend({ data }: SalesTrendProps) {
  return (
    <section>
      {/* SECTION HEADER */}

      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          Monthly Sales Trend
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Daily sales performance for the current month.
        </p>
      </div>

      {/* CHART CARD */}

      <div className="group relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 shadow-sm transition duration-200 hover:border-indigo-200 hover:shadow-md">
        {/* DECORATIVE BACKGROUND */}

        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-100/50 transition duration-300 group-hover:scale-110" />

        <div className="pointer-events-none absolute -bottom-20 -left-16 h-40 w-40 rounded-full bg-violet-100/40" />

        {/* CARD HEADER */}

        <div className="relative flex items-center justify-between border-b border-indigo-100/80 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-indigo-900">
              Sales Performance
            </p>

            <p className="mt-0.5 text-xs text-indigo-600/70">
              Daily revenue overview.
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm transition duration-200 group-hover:scale-105 group-hover:bg-indigo-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 17 9 11l4 4 8-9"
              />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 6h4v4"
              />
            </svg>
          </div>
        </div>

        {/* CHART */}

        <div className="relative p-5">
          <div className="overflow-hidden rounded-2xl border border-indigo-100/70 bg-white/80 p-3 shadow-sm backdrop-blur-sm sm:p-4">
            <SalesTrendChart data={data} />
          </div>
        </div>
      </div>
    </section>
  );
}
