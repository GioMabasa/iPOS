<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExpenseCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ExpenseCategory::query();

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $perPage = min(
            max((int) $request->input('per_page', 10), 1),
            100
        );

        $categories = $query
            ->orderBy('name')
            ->paginate($perPage);

        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                'unique:expense_categories,name',
            ],
            'description' => [
                'nullable',
                'string',
            ],
        ]);

        $category = ExpenseCategory::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Expense category created successfully.',
            'category' => $category,
        ], 201);
    }

    public function show(ExpenseCategory $expenseCategory): JsonResponse
    {
        return response()->json($expenseCategory);
    }

    public function update(
        Request $request,
        ExpenseCategory $expenseCategory
    ): JsonResponse {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                'unique:expense_categories,name,' . $expenseCategory->id,
            ],
            'description' => [
                'nullable',
                'string',
            ],
            'is_active' => [
                'sometimes',
                'boolean',
            ],
        ]);

        $expenseCategory->update($validated);

        return response()->json([
            'message' => 'Expense category updated successfully.',
            'category' => $expenseCategory,
        ]);
    }

    public function destroy(ExpenseCategory $expenseCategory): JsonResponse
    {
        if ($expenseCategory->expenses()->exists()) {
            return response()->json([
                'message' => 'This expense category cannot be deleted because it has existing expenses. You can deactivate it instead.',
            ], 422);
        }

        $expenseCategory->delete();

        return response()->json([
            'message' => 'Expense category deleted successfully.',
        ]);
    }
}
