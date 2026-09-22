<?php

namespace App\Services;

use App\Models\InventoryTransaction;
use App\Models\SaleItem;
use App\Models\SaleItemCost;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class InventoryCostService
{
    /**
     * Allocate inventory cost using FIFO.
     *
     * Returns the total cost of the sold quantity.
     */
    public function allocateFIFO(
        SaleItem $saleItem
    ): float {
        return DB::transaction(function () use ($saleItem) {
            $remainingQuantity = (float) $saleItem->quantity;
            $totalCost = 0.0;

            if ($remainingQuantity <= 0) {
                throw new RuntimeException(
                    'Sale quantity must be greater than zero.'
                );
            }

            $transactions = InventoryTransaction::query()
                ->where('product_id', $saleItem->product_id)
                ->where('type', 'purchase')
                ->orderBy('created_at')
                ->orderBy('id')
                ->lockForUpdate()
                ->get();

            foreach ($transactions as $transaction) {
                if ($remainingQuantity <= 0) {
                    break;
                }

                $availableQuantity = $this->getAvailableQuantity(
                    $transaction
                );

                if ($availableQuantity <= 0) {
                    continue;
                }

                $allocatedQuantity = min(
                    $remainingQuantity,
                    $availableQuantity
                );

                $unitCost = (float) $transaction->unit_cost;

                $allocatedCost = round(
                    $allocatedQuantity * $unitCost,
                    2
                );

                SaleItemCost::create([
                    'sale_item_id' => $saleItem->id,
                    'inventory_transaction_id' => $transaction->id,
                    'quantity' => $allocatedQuantity,
                    'reversed_quantity' => 0,
                    'unit_cost' => $unitCost,
                    'total_cost' => $allocatedCost,
                ]);

                $totalCost += $allocatedCost;
                $remainingQuantity -= $allocatedQuantity;
            }

            if ($remainingQuantity > 0) {
                throw new RuntimeException(
                    'Insufficient inventory for product ID '
                        . $saleItem->product_id
                        . '. Missing quantity: '
                        . $remainingQuantity
                );
            }

            return round($totalCost, 2);
        });
    }

    /**
     * Determine available quantity from a purchase layer.
     */
    private function getAvailableQuantity(
        InventoryTransaction $transaction
    ): float {
        $purchasedQuantity = (float) $transaction->quantity;

        $allocatedQuantity = (float) SaleItemCost::query()
            ->where(
                'inventory_transaction_id',
                $transaction->id
            )
            ->selectRaw(
                'COALESCE(SUM(quantity - reversed_quantity), 0) AS allocated_quantity'
            )
            ->value('allocated_quantity');

        return max(
            0,
            $purchasedQuantity - $allocatedQuantity
        );
    }

    /**
     * Reverse FIFO cost allocation.
     *
     * Used for VOID and REFUND.
     *
     * When $quantity is null, the full remaining
     * quantity of the sale item is reversed.
     */
    public function reverseFIFO(
        SaleItem $saleItem,
        ?float $quantity = null
    ): float {
        return DB::transaction(function () use (
            $saleItem,
            $quantity
        ) {
            $remainingQuantity = $quantity === null
                ? (float) $saleItem->quantity
                : (float) $quantity;

            $reversedCost = 0.0;

            if ($remainingQuantity <= 0) {
                return 0.0;
            }

            $costs = SaleItemCost::query()
                ->where('sale_item_id', $saleItem->id)
                ->orderByDesc('id')
                ->lockForUpdate()
                ->get();

            foreach ($costs as $cost) {
                if ($remainingQuantity <= 0) {
                    break;
                }

                $allocatedQuantity = (float) $cost->quantity;
                $alreadyReversed = (float) $cost->reversed_quantity;

                $availableToReverse = max(
                    0,
                    $allocatedQuantity - $alreadyReversed
                );

                if ($availableToReverse <= 0) {
                    continue;
                }

                $reverseQuantity = min(
                    $remainingQuantity,
                    $availableToReverse
                );

                $cost->increment(
                    'reversed_quantity',
                    $reverseQuantity
                );

                $reversedCost += round(
                    $reverseQuantity * (float) $cost->unit_cost,
                    2
                );

                $remainingQuantity -= $reverseQuantity;
            }

            if ($remainingQuantity > 0) {
                throw new RuntimeException(
                    'Unable to reverse FIFO cost allocation for sale item ID '
                        . $saleItem->id
                        . '. Missing quantity: '
                        . $remainingQuantity
                );
            }

            return round($reversedCost, 2);
        });
    }
}
