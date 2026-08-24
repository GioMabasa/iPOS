<?php

namespace App\Services;

use App\Models\InventoryTransaction;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class InventoryService
{
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
                ), 0) as stock
            ")
            ->value('stock');
    }

    //purchase/refund
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

    //sale/bad order
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
            $this->ensureSufficientStock($product, $quantity);

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

    public function restoreStock(
        Product $product,
        float $quantity,
        string $referenceType,
        int $referenceId,
        ?int $userId,
        ?string $notes = null
    ): InventoryTransaction {
        return DB::transaction(function () use (
            $product,
            $quantity,
            $referenceType,
            $referenceId,
            $userId,
            $notes
        ) {
            return InventoryTransaction::create([
                'product_id' => $product->id,
                'type' => 'adjustment',
                'quantity' => $quantity,
                'unit_cost' => null,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'created_by' => $userId,
                'notes' => $notes,
            ]);
        });
    }
}
