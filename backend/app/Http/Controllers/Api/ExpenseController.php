<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use App\Exports\ExpensesExport;
use Maatwebsite\Excel\Facades\Excel;

class ExpenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Expense::with([
            'category:id,name',
            'creator:id,name',
        ]);

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('reference_no', 'like', "%{$search}%");
            });
        }

        if ($request->filled('expense_category_id')) {
            $query->where(
                'expense_category_id',
                $request->expense_category_id
            );
        }

        if ($request->filled('payment_method')) {
            $query->where(
                'payment_method',
                $request->payment_method
            );
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate(
                'expense_date',
                '>=',
                $request->date_from
            );
        }

        if ($request->filled('date_to')) {
            $query->whereDate(
                'expense_date',
                '<=',
                $request->date_to
            );
        }

        $perPage = min(
            max((int) $request->input('per_page', 10), 1),
            100
        );

        $expenses = $query
            ->orderByDesc('expense_date')
            ->orderByDesc('id')
            ->paginate($perPage);

        return response()->json($expenses);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'expense_category_id' => [
                'required',
                'integer',
                'exists:expense_categories,id',
            ],
            'expense_date' => [
                'required',
                'date',
            ],
            'description' => [
                'required',
                'string',
                'max:255',
            ],
            'amount' => [
                'required',
                'numeric',
                'min:0.01',
            ],
            'payment_method' => [
                'required',
                'string',
                'max:255',
            ],
            'reference_no' => [
                'nullable',
                'string',
                'max:255',
            ],
            'notes' => [
                'nullable',
                'string',
            ],
        ]);

        $expense = DB::transaction(function () use ($validated) {
            return Expense::create([
                'expense_category_id' => $validated['expense_category_id'],
                'expense_date' => $validated['expense_date'],
                'description' => $validated['description'],
                'amount' => $validated['amount'],
                'payment_method' => $validated['payment_method'],
                'reference_no' => $validated['reference_no'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'status' => 'Recorded',
                'created_by' => Auth::id(),
            ]);
        });

        $expense->load([
            'category:id,name',
            'creator:id,name',
        ]);

        return response()->json([
            'message' => 'Expense created successfully.',
            'expense' => $expense,
        ], 201);
    }

    public function summary(Request $request): JsonResponse
    {
        $query = Expense::query();

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('reference_no', 'like', "%{$search}%");
            });
        }

        if ($request->filled('expense_category_id')) {
            $query->where(
                'expense_category_id',
                $request->expense_category_id
            );
        }

        if ($request->filled('payment_method')) {
            $query->where(
                'payment_method',
                $request->payment_method
            );
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate(
                'expense_date',
                '>=',
                $request->date_from
            );
        }

        if ($request->filled('date_to')) {
            $query->whereDate(
                'expense_date',
                '<=',
                $request->date_to
            );
        }

        $totalExpenses = (clone $query)
            ->where('status', 'Recorded')
            ->sum('amount');

        $recordedExpenses = (clone $query)
            ->where('status', 'Recorded')
            ->count();

        $voidedExpenses = (clone $query)
            ->where('status', 'Voided')
            ->sum('amount');

        $expenseTransactions = (clone $query)->count();

        return response()->json([
            'total_expenses' => (float) $totalExpenses,
            'recorded_expenses' => $recordedExpenses,
            'voided_expenses' => (float) $voidedExpenses,
            'expense_transactions' => $expenseTransactions,
        ]);
    }

    public function show(Expense $expense): JsonResponse
    {
        $expense->load([
            'category:id,name',
            'creator:id,name',
        ]);

        return response()->json($expense);
    }

    public function update(Request $request, Expense $expense): JsonResponse
    {
        if ($expense->status === 'Voided') {
            return response()->json([
                'message' => 'Voided expenses cannot be updated.',
            ], 422);
        }

        $validated = $request->validate([
            'expense_category_id' => [
                'required',
                'integer',
                'exists:expense_categories,id',
            ],
            'expense_date' => [
                'required',
                'date',
            ],
            'description' => [
                'required',
                'string',
                'max:255',
            ],
            'amount' => [
                'required',
                'numeric',
                'min:0.01',
            ],
            'payment_method' => [
                'required',
                'string',
                'max:255',
            ],
            'reference_no' => [
                'nullable',
                'string',
                'max:255',
            ],
            'notes' => [
                'nullable',
                'string',
            ],
        ]);

        $expense->update([
            'expense_category_id' => $validated['expense_category_id'],
            'expense_date' => $validated['expense_date'],
            'description' => $validated['description'],
            'amount' => $validated['amount'],
            'payment_method' => $validated['payment_method'],
            'reference_no' => $validated['reference_no'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        $expense->load([
            'category:id,name',
            'creator:id,name',
        ]);

        return response()->json([
            'message' => 'Expense updated successfully.',
            'expense' => $expense,
        ]);
    }

    public function void(Expense $expense): JsonResponse
    {
        if ($expense->status === 'Voided') {
            return response()->json([
                'message' => 'Expense is already voided.',
            ], 422);
        }

        $expense->update([
            'status' => 'Voided',
        ]);

        $expense->load([
            'category:id,name',
            'creator:id,name',
        ]);

        return response()->json([
            'message' => 'Expense voided successfully.',
            'expense' => $expense,
        ]);
    }

    public function export(Request $request)
    {
        $query = Expense::with([
            'category:id,name',
            'creator:id,name',
        ]);

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('reference_no', 'like', "%{$search}%");
            });
        }

        if ($request->filled('expense_category_id')) {
            $query->where(
                'expense_category_id',
                $request->expense_category_id
            );
        }

        if ($request->filled('payment_method')) {
            $query->where(
                'payment_method',
                $request->payment_method
            );
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate(
                'expense_date',
                '>=',
                $request->date_from
            );
        }

        if ($request->filled('date_to')) {
            $query->whereDate(
                'expense_date',
                '<=',
                $request->date_to
            );
        }

        $expenses = $query
            ->orderByDesc('expense_date')
            ->orderByDesc('id')
            ->get()
            ->map(function ($expense) {
                return [
                    'expense_date' => $expense->expense_date,
                    'category' => $expense->category?->name ?? '—',
                    'description' => $expense->description,
                    'payment_method' => $expense->payment_method,
                    'reference_no' => $expense->reference_no ?? '—',
                    'amount' => (float) $expense->amount,
                    'status' => $expense->status,
                    'notes' => $expense->notes ?? '—',
                ];
            });

        $category = null;

        if ($request->filled('expense_category_id')) {
            $category = \App\Models\ExpenseCategory::find(
                $request->expense_category_id
            );
        }

        return Excel::download(
            new ExpensesExport(
                data: $expenses,
                period: $request->input('period'),
                dateFrom: $request->input('date_from'),
                dateTo: $request->input('date_to'),
                search: $request->input('search'),
                category: $category?->name,
                paymentMethod: $request->input('payment_method'),
                status: $request->input('status')
            ),
            'expenses.xlsx'
        );
    }
}
