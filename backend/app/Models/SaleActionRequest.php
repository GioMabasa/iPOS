<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleActionRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_id',
        'requested_by',
        'action_type',
        'reason',
        'refund_items',
        'status',
        'approved_by',
        'approved_at',
        'rejected_at',
        'approval_reason',
    ];

    protected $casts = [
        'refund_items' => 'array',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    /**
     * Sale associated with this request.
     */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    /**
     * User who requested the action.
     */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    /**
     * Manager/Admin who approved or rejected the request.
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
