<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerPayment;
use App\Models\Sale;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReceivableController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Sale::query()
            ->with('customer')
            ->where('payment_method', 'charge')
            ->whereIn('status', ['completed', 'voided', 'refunded'])
            ->orderByDesc('sale_date')
            ->orderByDesc('id');

        if ($request->filled('search')) {
            $search = trim((string) $request->input('search'));

            $query->where(function ($q) use ($search) {
                $q->where('sale_number', 'like', "%{$search}%")
                    ->orWhere('invoice_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($customerQuery) use ($search) {
                        $customerQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $sales = $query->get();

        $data = $sales->map(function (Sale $sale) {
            $paid = (float) CustomerPayment::query()
                ->where('sale_id', $sale->id)
                ->sum('amount');

            $total = (float) $sale->total;
            $balance = max($total - $paid, 0);

            return [
                'id' => $sale->id,
                'sale_number' => $sale->sale_number,
                'invoice_number' => $sale->invoice_number,
                'customer_id' => $sale->customer_id,
                'customer' => $sale->customer,
                'sale_date' => $sale->sale_date?->toDateString(),
                'due_date' => $sale->due_date?->toDateString(),
                'term_months' => $sale->term_months,
                'total' => round($total, 2),
                'paid' => round($paid, 2),
                'balance' => round($balance, 2),
                'status' => $this->getStatus($sale, $paid, $balance),
            ];
        });

        return response()->json([
            'message' => 'Receivables retrieved successfully.',
            'data' => $data,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $sale = Sale::query()
            ->with([
                'customer',
                'items.product',
                'user',
            ])
            ->where('payment_method', 'charge')
            ->findOrFail($id);

        $payments = CustomerPayment::query()
            ->with('receivedBy')
            ->where('sale_id', $sale->id)
            ->orderByDesc('payment_date')
            ->orderByDesc('id')
            ->get();

        $total = (float) $sale->total;
        $paid = (float) $payments->sum('amount');
        $balance = max($total - $paid, 0);

        return response()->json([
            'message' => 'Receivable retrieved successfully.',
            'data' => [
                'id' => $sale->id,
                'sale_number' => $sale->sale_number,
                'invoice_number' => $sale->invoice_number,
                'customer_id' => $sale->customer_id,
                'customer' => $sale->customer,
                'sale_date' => $sale->sale_date?->toDateString(),
                'due_date' => $sale->due_date?->toDateString(),
                'term_months' => $sale->term_months,
                'total' => round($total, 2),
                'paid' => round($paid, 2),
                'balance' => round($balance, 2),
                'status' => $this->getStatus($sale, $paid, $balance),
                'items' => $sale->items,
                'user' => $sale->user,
                'payments' => $payments,
            ],
        ]);
    }

    public function storePayment(
        Request $request,
        int $id
    ): JsonResponse {
        $sale = Sale::query()
            ->where('payment_method', 'charge')
            ->where('status', 'completed')
            ->findOrFail($id);

        if (!$sale->customer_id) {
            throw ValidationException::withMessages([
                'customer_id' => ['This charge sale does not have a customer.'],
            ]);
        }

        $validated = $request->validate([
            'payment_date' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'gt:0'],
            'payment_method' => ['required', 'string', 'max:50'],
            'reference_number' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $totalPaid = (float) CustomerPayment::query()
            ->where('sale_id', $sale->id)
            ->sum('amount');

        $total = (float) $sale->total;
        $balance = max($total - $totalPaid, 0);
        $paymentAmount = (float) $validated['amount'];

        if ($paymentAmount > $balance) {
            throw ValidationException::withMessages([
                'amount' => [
                    'Payment amount cannot be greater than the remaining balance.',
                ],
            ]);
        }

        $payment = DB::transaction(function () use (
            $validated,
            $sale,
            $paymentAmount
        ) {
            return CustomerPayment::create([
                'sale_id' => $sale->id,
                'customer_id' => $sale->customer_id,
                'payment_date' => $validated['payment_date'],
                'amount' => $paymentAmount,
                'payment_method' => $validated['payment_method'],
                'reference_number' => $validated['reference_number'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'received_by' => Auth::id(),
            ]);
        });

        $newPaid = $totalPaid + $paymentAmount;
        $newBalance = max($total - $newPaid, 0);

        return response()->json([
            'message' => 'Customer payment recorded successfully.',
            'data' => [
                'payment' => $payment->load('receivedBy'),
                'paid' => round($newPaid, 2),
                'balance' => round($newBalance, 2),
                'status' => $this->getStatus(
                    $sale,
                    $newPaid,
                    $newBalance
                ),
            ],
        ], 201);
    }

    private function getStatus(
        Sale $sale,
        float $paid,
        float $balance
    ): string {
        if ($balance <= 0) {
            return 'paid';
        }

        if (
            $sale->due_date &&
            $sale->due_date->isPast()
        ) {
            return 'overdue';
        }

        if ($paid > 0) {
            return 'partial';
        }

        return 'unpaid';
    }
}
