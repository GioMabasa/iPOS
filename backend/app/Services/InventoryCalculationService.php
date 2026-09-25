<?php

namespace App\Services;

use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\SaleItemCost;
use Illuminate\Support\Collection;

class InventoryCalculationService
{
    /**
     * Number of products processed per calculation batch.
     *
     * This reduces the amount of inventory transaction and FIFO
     * data held in memory at one time.
     */
    protected int $chunkSize = 500;

    /**
     * Calculate inventory data for the given products.
     *
     * This is the shared source of truth for:
     * - Inventory page
     * - Inventory export
     *
     * Products are processed in batches to reduce memory usage.
     */
    public function calculate(Collection $products): Collection
    {
        if ($products->isEmpty()) {
            return collect();
        }

        $result = collect();

        foreach ($products->chunk($this->chunkSize) as $productChunk) {
            $result = $result->concat(
                $this->calculateChunk($productChunk)
            );
        }

        return $result->values();
    }

    /**
     * Calculate inventory data for a single batch of products.
     *
     * Inventory transaction records are retrieved as lightweight
     * query results instead of hydrated Eloquent models.
     */
    protected function calculateChunk(
        Collection $products
    ): Collection {
        if ($products->isEmpty()) {
            return collect();
        }

        $productIds = $products
            ->pluck('id')
            ->values();

        /*
        |--------------------------------------------------------------------------
        | Current Stock
        |--------------------------------------------------------------------------
        */

        $stockByProduct = InventoryTransaction::query()
            ->whereIn('product_id', $productIds)
            ->select('product_id')
            ->selectRaw("
                COALESCE(SUM(
                    CASE
                        WHEN type IN ('purchase', 'refund')
                            THEN quantity

                        WHEN type IN ('sale', 'bad_order')
                            THEN -quantity

                        WHEN type = 'adjustment'
                            THEN quantity

                        ELSE 0
                    END
                ), 0) AS stock
            ")
            ->groupBy('product_id')
            ->pluck('stock', 'product_id')
            ->map(fn($stock) => (float) $stock);

        /*
        |--------------------------------------------------------------------------
        | Purchase Transactions
        |--------------------------------------------------------------------------
        */

        $purchaseTransactions = InventoryTransaction::query()
            ->whereIn('product_id', $productIds)
            ->where('type', 'purchase')
            ->orderBy('product_id')
            ->orderBy('created_at')
            ->orderBy('id')
            ->get([
                'id',
                'product_id',
                'quantity',
                'unit_cost',
            ]);

        /*
        |--------------------------------------------------------------------------
        | Sale Cost Allocations
        |--------------------------------------------------------------------------
        */

        $allocatedByTransaction = collect();

        if ($purchaseTransactions->isNotEmpty()) {
            $allocatedByTransaction = SaleItemCost::query()
                ->whereIn(
                    'inventory_transaction_id',
                    $purchaseTransactions->pluck('id')
                )
                ->select('inventory_transaction_id')
                ->selectRaw("
                    COALESCE(
                        SUM(quantity - reversed_quantity),
                        0
                    ) AS allocated_quantity
                ")
                ->groupBy('inventory_transaction_id')
                ->pluck(
                    'allocated_quantity',
                    'inventory_transaction_id'
                )
                ->map(fn($quantity) => (float) $quantity);
        }

        /*
        |--------------------------------------------------------------------------
        | FIFO Layers
        |--------------------------------------------------------------------------
        */

        $layersByProduct = [];

        foreach ($purchaseTransactions as $transaction) {
            $purchasedQuantity = (float) $transaction->quantity;

            $allocatedQuantity = $allocatedByTransaction->get(
                $transaction->id,
                0.0
            );

            $remainingQuantity = max(
                0,
                $purchasedQuantity - $allocatedQuantity
            );

            if ($remainingQuantity <= 0) {
                continue;
            }

            $layersByProduct[$transaction->product_id][] = [
                'quantity' => $remainingQuantity,
                'unit_cost' => (float) $transaction->unit_cost,
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | Release Transaction Data Before Building Final Result
        |--------------------------------------------------------------------------
        */

        unset(
            $purchaseTransactions,
            $allocatedByTransaction
        );

        /*
        |--------------------------------------------------------------------------
        | Build Inventory Data
        |--------------------------------------------------------------------------
        */

        return $products
            ->map(function (Product $product) use (
                $stockByProduct,
                $layersByProduct
            ) {
                $stock = $stockByProduct->get(
                    $product->id,
                    0.0
                );

                $minimumStock = (float) $product->minimum_stock;

                $remainingStock = max(0, $stock);

                $inventoryValue = 0.0;

                $layers = $layersByProduct[$product->id] ?? [];

                foreach ($layers as $layer) {
                    if ($remainingStock <= 0) {
                        break;
                    }

                    $layerQuantity = min(
                        $remainingStock,
                        $layer['quantity']
                    );

                    $inventoryValue += round(
                        $layerQuantity * $layer['unit_cost'],
                        2
                    );

                    $remainingStock -= $layerQuantity;
                }

                $cost = $stock > 0
                    ? round(
                        $inventoryValue / $stock,
                        2
                    )
                    : 0.0;

                $supplierNames = $product->suppliers
                    ->pluck('name')
                    ->filter()
                    ->implode(', ');

                $isLowStock = $stock <= $minimumStock;

                return [
                    'product_id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'barcode' => $product->barcode,
                    'supplier' => $supplierNames,
                    'unit' => $product->unit,
                    'cost' => $cost,
                    'selling_price' => (float) $product->selling_price,
                    'stock' => $stock,
                    'stock_value' => round(
                        $inventoryValue,
                        2
                    ),
                    'minimum_stock' => $minimumStock,
                    'is_low_stock' => $isLowStock,
                    'is_active' => (bool) $product->is_active,
                ];
            })
            ->values();
    }
}
