<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SaleItem extends Model
{
    protected $fillable = [
        'sale_id',
        'product_id',
        'quantity',
        'unit_price',
        'discount',
        'total',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'unit_price' => 'decimal:2',
        'discount' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    /**
     * Sale this item belongs to.
     */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(
            Sale::class
        );
    }

    /**
     * Product sold in this item.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(
            Product::class
        );
    }

    /**
     * FIFO cost allocations for this sale item.
     */
    public function costs(): HasMany
    {
        return $this->hasMany(
            SaleItemCost::class
        );
    }

    /**
     * Get total COGS for this sale item.
     *
     * Only non-reversed cost is counted.
     */
    public function getCogsAttribute(): float
    {
        return round(
            (float) $this->costs()
                ->selectRaw(
                    'COALESCE(SUM(total_cost - (reversed_quantity * unit_cost)), 0)'
                )
                ->value(),
            2
        );
    }

    /**
     * Get gross profit for this sale item.
     */
    public function getGrossProfitAttribute(): float
    {
        return round(
            (float) $this->total - $this->cogs,
            2
        );
    }
}
