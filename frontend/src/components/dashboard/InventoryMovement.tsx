import type { InventorySummary } from "../../types/report";

interface InventoryMovementProps {
  inventory: InventorySummary;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-PH").format(Number(value) || 0);
}

export default function InventoryMovement({
  inventory,
}: InventoryMovementProps) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Inventory Movement
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Stock movement for the selected period.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* ======================================================
            STOCK IN
        ====================================================== */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Stock In</p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatNumber(inventory.total_in)}
          </p>

          <p className="mt-1 text-xs text-gray-500">Items received</p>
        </div>

        {/* ======================================================
            STOCK OUT
        ====================================================== */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Stock Out</p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatNumber(inventory.total_out)}
          </p>

          <p className="mt-1 text-xs text-gray-500">Items released</p>
        </div>

        {/* ======================================================
            NET MOVEMENT
        ====================================================== */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Net Movement</p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatNumber(inventory.net_movement)}
          </p>

          <p className="mt-1 text-xs text-gray-500">Net inventory movement</p>
        </div>

        {/* ======================================================
            REFUNDS
        ====================================================== */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Refunds</p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatNumber(inventory.refunds)}
          </p>

          <p className="mt-1 text-xs text-gray-500">Items returned</p>
        </div>
      </div>

      {/* ========================================================
          MOVEMENT DETAILS
      ======================================================== */}

      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900">
            Movement Details
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
          {/* PURCHASES */}

          <div>
            <p className="text-xs text-gray-500">Purchases</p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {formatNumber(inventory.purchases)}
            </p>
          </div>

          {/* SALES */}

          <div>
            <p className="text-xs text-gray-500">Sales</p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {formatNumber(inventory.sales)}
            </p>
          </div>

          {/* REFUNDS */}

          <div>
            <p className="text-xs text-gray-500">Refunds</p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {formatNumber(inventory.refunds)}
            </p>
          </div>

          {/* VOIDS */}

          <div>
            <p className="text-xs text-gray-500">Voids</p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {formatNumber(inventory.voids)}
            </p>
          </div>

          {/* BAD ORDERS */}

          <div>
            <p className="text-xs text-gray-500">Bad Orders</p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {formatNumber(inventory.bad_orders)}
            </p>
          </div>

          {/* ADJUSTMENT IN */}

          <div>
            <p className="text-xs text-gray-500">Adjustment In</p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {formatNumber(inventory.adjustment_in)}
            </p>
          </div>

          {/* ADJUSTMENT OUT */}

          <div>
            <p className="text-xs text-gray-500">Adjustment Out</p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {formatNumber(inventory.adjustment_out)}
            </p>
          </div>

          {/* TRANSACTIONS */}

          <div>
            <p className="text-xs text-gray-500">Transactions</p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {formatNumber(inventory.transaction_count)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
