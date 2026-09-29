<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SupplierController extends Controller
{
    /**
     * Display a paginated list of suppliers.
     *
     * Supports:
     * - search
     * - status: all / active / inactive
     * - pagination
     */
    public function index(Request $request)
    {
        $query = Supplier::query();

        /*
        |--------------------------------------------------------------------------
        | Search
        |--------------------------------------------------------------------------
        */

        if ($request->filled('search')) {
            $search = $request->input('search');

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('contact_person', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('tax_number', 'like', "%{$search}%");
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Status Filter
        |--------------------------------------------------------------------------
        */

        if ($request->input('status') === 'active') {
            $query->where('is_active', true);
        }

        if ($request->input('status') === 'inactive') {
            $query->where('is_active', false);
        }

        /*
        |--------------------------------------------------------------------------
        | Ordering
        |--------------------------------------------------------------------------
        */

        $suppliers = $query
            ->latest()
            ->paginate(
                $request->integer('per_page', 20)
            );

        return response()->json($suppliers);
    }

    /**
     * Export suppliers.
     *
     * Available to Admin, Manager, and Cashier.
     */
    public function export(Request $request): StreamedResponse
    {
        $query = Supplier::query();

        /*
        |--------------------------------------------------------------------------
        | Search
        |--------------------------------------------------------------------------
        */

        if ($request->filled('search')) {
            $search = $request->input('search');

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('contact_person', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('tax_number', 'like', "%{$search}%");
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Status Filter
        |--------------------------------------------------------------------------
        */

        if ($request->input('status') === 'active') {
            $query->where('is_active', true);
        }

        if ($request->input('status') === 'inactive') {
            $query->where('is_active', false);
        }

        $filename = 'suppliers-' . now()->format('Y-m-d-His') . '.csv';

        return response()->streamDownload(function () use ($query) {
            $handle = fopen('php://output', 'w');

            /*
            |--------------------------------------------------------------------------
            | CSV Header
            |--------------------------------------------------------------------------
            */

            fputcsv($handle, [
                'Supplier Name',
                'Contact Person',
                'Phone',
                'Email',
                'Address',
                'Tax Number',
                'Notes',
                'Status',
            ]);

            /*
            |--------------------------------------------------------------------------
            | Data
            |--------------------------------------------------------------------------
            */

            $query
                ->orderBy('name')
                ->chunk(1000, function ($suppliers) use ($handle) {
                    foreach ($suppliers as $supplier) {
                        fputcsv($handle, [
                            $supplier->name,
                            $supplier->contact_person,
                            $supplier->phone,
                            $supplier->email,
                            $supplier->address,
                            $supplier->tax_number,
                            $supplier->notes,
                            $supplier->is_active ? 'Active' : 'Inactive',
                        ]);
                    }
                });

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Store a newly created supplier.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'tax_number' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        /*
        |--------------------------------------------------------------------------
        | Cashier-created suppliers are always inactive.
        |--------------------------------------------------------------------------
        */

        if (Auth::user()?->role === 'cashier') {
            $validated['is_active'] = false;
        } else {
            $validated['is_active'] = $validated['is_active'] ?? true;
        }

        $supplier = Supplier::create($validated);

        return response()->json([
            'message' => 'Supplier created successfully.',
            'data' => $supplier,
        ], 201);
    }

    /**
     * Display the specified supplier.
     */
    public function show(Supplier $supplier)
    {
        return response()->json([
            'data' => $supplier,
        ]);
    }

    /**
     * Update the specified supplier.
     */
    public function update(Request $request, Supplier $supplier)
    {
        /*
        |--------------------------------------------------------------------------
        | Cashier can only edit inactive suppliers.
        |--------------------------------------------------------------------------
        */

        if (
            Auth::user()?->role === 'cashier'
            && $supplier->is_active
        ) {
            return response()->json([
                'message' => 'Cashiers can only edit inactive suppliers.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'tax_number' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        /*
        |--------------------------------------------------------------------------
        | Cashier cannot change supplier status.
        |--------------------------------------------------------------------------
        */

        if (Auth::user()?->role === 'cashier') {
            unset($validated['is_active']);
        }

        $supplier->update($validated);

        return response()->json([
            'message' => 'Supplier updated successfully.',
            'data' => $supplier->fresh(),
        ]);
    }

    /**
     * Remove the specified supplier.
     */
    public function destroy(Supplier $supplier)
    {
        /*
        |--------------------------------------------------------------------------
        | Cashier cannot delete suppliers.
        |--------------------------------------------------------------------------
        */

        if (Auth::user()?->role === 'cashier') {
            return response()->json([
                'message' => 'Cashiers are not allowed to delete suppliers.',
            ], 403);
        }

        $supplier->delete();

        return response()->json([
            'message' => 'Supplier deleted successfully.',
        ]);
    }
}
