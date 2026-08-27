<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleItemCost extends Model
{
    protected $fillable = [
        'sale_item_id',
        'inventory_transaction_id',
        'quantity',
        'reversed_quantity',
        'unit_cost',
        'total_cost',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'reversed_quantity' => 'decimal:3',
        'unit_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
    ];

    /**
     * Sale item that owns this cost allocation.
     */
    public function saleItem(): BelongsTo
    {
        return $this->belongsTo(
            SaleItem::class
        );
    }

    /**
     * Purchase inventory transaction
     * used for this FIFO allocation.
     */
    public function inventoryTransaction(): BelongsTo
    {
        return $this->belongsTo(
            InventoryTransaction::class
        );
    }

    /**
     * Quantity still active after reversals.
     */
    public function getActiveQuantityAttribute(): float
    {
        return max(
            0,
            (float) $this->quantity
                - (float) $this->reversed_quantity
        );
    }

    /**
     * Remaining active cost.
     */
    public function getActiveCostAttribute(): float
    {
        return round(
            $this->active_quantity
                * (float) $this->unit_cost,
            2
        );
    }
}
