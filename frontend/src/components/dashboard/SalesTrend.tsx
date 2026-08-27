import type { SalesTrendItem } from "../../types/report";
import SalesTrendChart from "./SalesTrendChart";

interface SalesTrendProps {
  data: SalesTrendItem[];
}

export default function SalesTrend({ data }: SalesTrendProps) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Sales Trend</h2>

        <p className="mt-1 text-sm text-gray-500">
          Daily sales performance for the selected period.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <SalesTrendChart data={data} />
      </div>
    </section>
  );
}
