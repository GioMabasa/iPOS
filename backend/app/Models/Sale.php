<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends Model
{
    protected $fillable = [
        'sale_number',
        'invoice_number',
        'customer_id',
        'user_id',
        'sale_date',
        'subtotal',
        'discount',
        'tax',
        'total',
        'payment_method',
        'term_months',
        'due_date',
        'amount_paid',
        'change_amount',
        'status',
        'notes',
    ];

    protected $casts = [
        'sale_date' => 'date',
        'term_months' => 'integer',
        'due_date' => 'date',
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'tax' => 'decimal:2',
        'total' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'change_amount' => 'decimal:2',
    ];

    protected $appends = [
        'total_cost',
        'gross_profit',
        'gross_margin',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function actionRequests(): HasMany
    {
        return $this->hasMany(SaleActionRequest::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    /*
    |--------------------------------------------------------------------------
    | COGS
    |--------------------------------------------------------------------------
    */

    /**
     * Total COGS for this sale.
     *
     * Uses sale_item_costs directly through sale_items.
     */
    public function getTotalCostAttribute(): float
    {
        return round(
            (float) SaleItemCost::query()
                ->whereHas('saleItem', function ($query) {
                    $query->where(
                        'sale_id',
                        $this->id
                    );
                })
                ->sum('total_cost'),
            2
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Gross Profit
    |--------------------------------------------------------------------------
    */

    /**
     * Gross profit for this sale.
     */
    public function getGrossProfitAttribute(): float
    {
        return round(
            (float) $this->total - $this->total_cost,
            2
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Gross Margin
    |--------------------------------------------------------------------------
    */

    /**
     * Gross margin percentage.
     */
    public function getGrossMarginAttribute(): float
    {
        $total = (float) $this->total;

        if ($total <= 0) {
            return 0.0;
        }

        return round(
            ($this->gross_profit / $total) * 100,
            2
        );
    }
}
