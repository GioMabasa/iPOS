<?php

namespace App\Services;

use App\Models\InventoryTransaction;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class InventoryService
{
    /**
     * Get current available stock.
     */
    public function getCurrentStock(Product $product): float
    {
        return (float) $product->inventoryTransactions()
            ->selectRaw("
                COALESCE(SUM(
                    CASE
                        WHEN type IN ('purchase', 'refund') THEN quantity
                        WHEN type IN ('sale', 'bad_order') THEN -quantity
                        WHEN type = 'adjustment' THEN quantity
                        ELSE 0
                    END
                ), 0) AS stock
            ")
            ->value('stock');
    }

    /**
     * Receive stock from a purchase.
     */
    public function receiveStock(
        Product $product,
        float $quantity,
        float $unitCost,
        string $referenceType,
        int $referenceId,
        ?int $userId,
        ?string $notes = null
    ): InventoryTransaction {
        return DB::transaction(function () use (
            $product,
            $quantity,
            $unitCost,
            $referenceType,
            $referenceId,
            $userId,
            $notes
        ) {
            return InventoryTransaction::create([
                'product_id' => $product->id,
                'type' => 'purchase',
                'quantity' => $quantity,
                'unit_cost' => $unitCost,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'created_by' => $userId,
                'notes' => $notes,
            ]);
        });
    }

    /**
     * Record a refund into inventory.
     *
     * IMPORTANT:
     * unitCost must be the ORIGINAL inventory cost,
     * not the selling price.
     */
    public function refundStock(
        Product $product,
        float $quantity,
        float $unitCost,
        string $referenceType,
        int $referenceId,
        ?int $userId,
        ?string $notes = null
    ): InventoryTransaction {
        return DB::transaction(function () use (
            $product,
            $quantity,
            $unitCost,
            $referenceType,
            $referenceId,
            $userId,
            $notes
        ) {
            return InventoryTransaction::create([
                'product_id' => $product->id,
                'type' => 'refund',
                'quantity' => $quantity,
                'unit_cost' => $unitCost,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'created_by' => $userId,
                'notes' => $notes,
            ]);
        });
    }

    /**
     * Manual inventory adjustment or bad order.
     */
    public function adjustStock(
        Product $product,
        float $quantity,
        ?int $userId,
        ?string $notes = null,
        string $type = 'adjustment'
    ): InventoryTransaction {
        return DB::transaction(function () use (
            $product,
            $quantity,
            $userId,
            $notes,
            $type
        ) {
            if (!in_array($type, ['adjustment', 'bad_order'])) {
                throw new RuntimeException(
                    'Invalid inventory adjustment type.'
                );
            }

            if ($quantity == 0) {
                throw new RuntimeException(
                    'Inventory adjustment quantity cannot be zero.'
                );
            }

            /*
         * Bad Order always removes stock.
         */
            if ($type === 'bad_order') {
                $quantity = abs($quantity);

                $this->ensureSufficientStock(
                    $product,
                    $quantity
                );
            }

            return InventoryTransaction::create([
                'product_id' => $product->id,
                'type' => $type,
                'quantity' => $quantity,
                'unit_cost' => null,
                'reference_type' => $type === 'bad_order'
                    ? 'bad_order'
                    : 'manual_adjustment',
                'reference_id' => null,
                'created_by' => $userId,
                'notes' => $notes,
            ]);
        });
    }

    /**
     * Ensure sufficient stock exists.
     */
    public function ensureSufficientStock(
        Product $product,
        float $quantity
    ): void {
        $currentStock = $this->getCurrentStock($product);

        if ($quantity > $currentStock) {
            throw new RuntimeException(
                "Insufficient stock for {$product->name}. " .
                    "Available: {$currentStock}, Requested: {$quantity}"
            );
        }
    }

    /**
     * Remove stock for a sale.
     *
     * The unitCost here should be the actual cost used
     * by the FIFO allocation service.
     */
    public function removeStock(
        Product $product,
        float $quantity,
        float $unitCost,
        string $referenceType,
        int $referenceId,
        ?int $userId,
        ?string $notes = null
    ): InventoryTransaction {
        return DB::transaction(function () use (
            $product,
            $quantity,
            $unitCost,
            $referenceType,
            $referenceId,
            $userId,
            $notes
        ) {
            $this->ensureSufficientStock(
                $product,
                $quantity
            );

            return InventoryTransaction::create([
                'product_id' => $product->id,
                'type' => 'sale',
                'quantity' => $quantity,
                'unit_cost' => $unitCost,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'created_by' => $userId,
                'notes' => $notes,
            ]);
        });
    }

    /**
     * Restore stock for a void operation.
     *
     * This keeps the inventory transaction as an adjustment
     * because the database enum does not currently contain
     * a dedicated "void" type.
     */
    public function restoreStock(
        Product $product,
        float $quantity,
        string $referenceType,
        int $referenceId,
        ?int $userId,
        ?string $notes = null,
        ?float $unitCost = null
    ): InventoryTransaction {
        return DB::transaction(function () use (
            $product,
            $quantity,
            $referenceType,
            $referenceId,
            $userId,
            $notes,
            $unitCost
        ) {
            return InventoryTransaction::create([
                'product_id' => $product->id,
                'type' => 'adjustment',
                'quantity' => $quantity,
                'unit_cost' => $unitCost,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'created_by' => $userId,
                'notes' => $notes,
            ]);
        });
    }

    /**
     * Restore a specific FIFO cost layer.
     *
     * Used by void/refund operations.
     */
    public function restoreCostLayer(
        Product $product,
        float $quantity,
        float $unitCost,
        string $referenceType,
        int $referenceId,
        ?int $userId,
        ?string $notes = null
    ): InventoryTransaction {
        return DB::transaction(function () use (
            $product,
            $quantity,
            $unitCost,
            $referenceType,
            $referenceId,
            $userId,
            $notes
        ) {
            return InventoryTransaction::create([
                'product_id' => $product->id,
                'type' => 'adjustment',
                'quantity' => $quantity,
                'unit_cost' => $unitCost,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'created_by' => $userId,
                'notes' => $notes,
            ]);
        });
    }
}
