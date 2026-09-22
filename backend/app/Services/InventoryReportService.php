<?php

namespace App\Services;

use App\Models\InventoryTransaction;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class InventoryReportService
{
    public function __construct(
        private InventoryService $inventoryService
    ) {}


    /*
    |--------------------------------------------------------------------------
    | Inventory Movement
    |--------------------------------------------------------------------------
    */

    /**
     * Get inventory movement report for a date range.
     */
    public function movement(
        ?string $from = null,
        ?string $to = null
    ): Collection {

        $query = InventoryTransaction::query()
            ->with([
                'product',
            ])
            ->orderBy('created_at')
            ->orderBy('id');

        /*
        |--------------------------------------------------------------------------
        | Manila Timezone Date Range
        |--------------------------------------------------------------------------
        */

        if ($from !== null) {

            $fromDate = Carbon::parse(
                $from,
                'Asia/Manila'
            )
                ->startOfDay()
                ->utc();

            $query->where(
                'created_at',
                '>=',
                $fromDate
            );
        }

        if ($to !== null) {

            $toDate = Carbon::parse(
                $to,
                'Asia/Manila'
            )
                ->endOfDay()
                ->utc();

            $query->where(
                'created_at',
                '<=',
                $toDate
            );
        }

        return $query
            ->get()
            ->map(function (
                InventoryTransaction $transaction
            ) {

                $quantity =
                    (float) $transaction->quantity;

                return [
                    'transaction_id' =>
                    $transaction->id,

                    'date' =>
                    $transaction->created_at
                        ? $transaction->created_at
                        ->setTimezone('Asia/Manila')
                        ->format('Y-m-d H:i:s')
                        : null,

                    'product_id' =>
                    $transaction->product_id,

                    'product_name' =>
                    $transaction->product?->name,

                    'sku' =>
                    $transaction->product?->sku,

                    'type' =>
                    $transaction->type,

                    'quantity' =>
                    round(
                        abs($quantity),
                        3
                    ),

                    'direction' =>
                    $this->resolveDirection(
                        $transaction
                    ),

                    'reference_type' =>
                    $transaction->reference_type,

                    'reference_id' =>
                    $transaction->reference_id,

                    'unit_cost' =>
                    $transaction->unit_cost !== null
                        ? round(
                            (float) $transaction->unit_cost,
                            2
                        )
                        : null,

                    'notes' =>
                    $transaction->notes,

                    'created_by' =>
                    $transaction->created_by,
                ];
            });
    }


    /*
    |--------------------------------------------------------------------------
    | Inventory Movement Summary
    |--------------------------------------------------------------------------
    */

    /**
     * Get inventory movement summary.
     */
    public function summary(
        ?string $from = null,
        ?string $to = null
    ): array {

        $transactions =
            InventoryTransaction::query()
            ->when(
                $from !== null,
                function ($query) use ($from) {

                    $fromDate = Carbon::parse(
                        $from,
                        'Asia/Manila'
                    )
                        ->startOfDay()
                        ->utc();

                    $query->where(
                        'created_at',
                        '>=',
                        $fromDate
                    );
                }
            )
            ->when(
                $to !== null,
                function ($query) use ($to) {

                    $toDate = Carbon::parse(
                        $to,
                        'Asia/Manila'
                    )
                        ->endOfDay()
                        ->utc();

                    $query->where(
                        'created_at',
                        '<=',
                        $toDate
                    );
                }
            )
            ->get();


        $transactionCount =
            $transactions->count();

        $totalIn = 0.0;
        $totalOut = 0.0;

        $purchases = 0.0;
        $sales = 0.0;
        $refunds = 0.0;
        $voids = 0.0;
        $badOrders = 0.0;

        $adjustmentIn = 0.0;
        $adjustmentOut = 0.0;


        foreach ($transactions as $transaction) {

            $quantity =
                (float) $transaction->quantity;


            /*
            |--------------------------------------------------------------------------
            | Purchase
            |--------------------------------------------------------------------------
            */

            if ($transaction->type === 'purchase') {

                $totalIn += $quantity;
                $purchases += $quantity;

                continue;
            }


            /*
            |--------------------------------------------------------------------------
            | Sale
            |--------------------------------------------------------------------------
            */

            if ($transaction->type === 'sale') {

                $totalOut += $quantity;
                $sales += $quantity;

                continue;
            }


            /*
            |--------------------------------------------------------------------------
            | Refund
            |--------------------------------------------------------------------------
            */

            if ($transaction->type === 'refund') {

                $totalIn += $quantity;
                $refunds += $quantity;

                continue;
            }


            /*
            |--------------------------------------------------------------------------
            | Bad Order
            |--------------------------------------------------------------------------
            */

            if ($transaction->type === 'bad_order') {

                $totalOut += abs($quantity);
                $badOrders += abs($quantity);

                continue;
            }


            /*
            |--------------------------------------------------------------------------
            | Adjustment
            |--------------------------------------------------------------------------
            */

            if ($transaction->type === 'adjustment') {

                /*
                 * Sale void returns inventory.
                 */

                if (
                    $transaction->reference_type
                    === 'sale_void'
                ) {

                    $totalIn += abs($quantity);
                    $voids += abs($quantity);

                    continue;
                }


                /*
                 * Normal adjustment.
                 */

                if ($quantity >= 0) {

                    $totalIn += $quantity;
                    $adjustmentIn += $quantity;
                } else {

                    $totalOut += abs($quantity);
                    $adjustmentOut += abs($quantity);
                }
            }
        }


        return [

            'transaction_count' =>
            $transactionCount,

            'total_in' =>
            round($totalIn, 3),

            'total_out' =>
            round($totalOut, 3),

            'net_movement' =>
            round(
                $totalIn - $totalOut,
                3
            ),

            'purchases' =>
            round($purchases, 3),

            'sales' =>
            round($sales, 3),

            'refunds' =>
            round($refunds, 3),

            'voids' =>
            round($voids, 3),

            'bad_orders' =>
            round($badOrders, 3),

            'adjustment_in' =>
            round($adjustmentIn, 3),

            'adjustment_out' =>
            round($adjustmentOut, 3),
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | Low Stock / Out of Stock
    |--------------------------------------------------------------------------
    */

    /**
     * Get current low-stock and out-of-stock products.
     */
    public function lowStock(): Collection
    {
        return Product::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(function (Product $product) {

                $currentStock =
                    (float) $this->inventoryService
                        ->getCurrentStock($product);

                $minimumStock =
                    (float) $product->minimum_stock;


                $currentStock =
                    round($currentStock, 3);

                $minimumStock =
                    round($minimumStock, 3);


                if ($currentStock <= 0) {

                    $status = 'out_of_stock';
                } elseif (
                    $currentStock <= $minimumStock
                ) {

                    $status = 'low_stock';
                } else {

                    return null;
                }


                return [

                    'product_id' =>
                    $product->id,

                    'product_name' =>
                    $product->name,

                    'sku' =>
                    $product->sku,

                    'unit' =>
                    $product->unit,

                    'current_stock' =>
                    $currentStock,

                    'minimum_stock' =>
                    $minimumStock,

                    'status' =>
                    $status,
                ];
            })
            ->filter()
            ->values();
    }


    /*
    |--------------------------------------------------------------------------
    | Direction
    |--------------------------------------------------------------------------
    */

    /**
     * Resolve inventory movement direction.
     */
    private function resolveDirection(
        InventoryTransaction $transaction
    ): string {

        if (
            $transaction->type === 'purchase'
            || $transaction->type === 'refund'
        ) {

            return 'in';
        }


        if (
            $transaction->type === 'sale'
            || $transaction->type === 'bad_order'
        ) {

            return 'out';
        }


        if ($transaction->type === 'adjustment') {

            if (
                $transaction->reference_type
                === 'sale_void'
            ) {

                return 'in';
            }

            return $transaction->quantity >= 0
                ? 'in'
                : 'out';
        }


        return 'unknown';
    }
}
