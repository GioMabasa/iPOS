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
        'refunded_quantity',
        'unit_price',
        'discount',
        'total',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'refunded_quantity' => 'decimal:3',
        'unit_price' => 'decimal:2',
        'discount' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    protected $appends = [
        'total_cost',
        'gross_profit',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function costs(): HasMany
    {
        return $this->hasMany(SaleItemCost::class);
    }

    /*
    |--------------------------------------------------------------------------
    | COGS
    |--------------------------------------------------------------------------
    */

    public function getTotalCostAttribute(): float
    {
        return round(
            (float) $this->costs()
                ->sum('total_cost'),
            2
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Gross Profit
    |--------------------------------------------------------------------------
    */

    public function getGrossProfitAttribute(): float
    {
        return round(
            (float) $this->total - $this->total_cost,
            2
        );
    }
}
