<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Exports\ProductsExport;
use Maatwebsite\Excel\Facades\Excel;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => [
                'nullable',
                'string',
                'max:255',
            ],

            'category_id' => [
                'nullable',
                'integer',
                'exists:categories,id',
            ],

            'is_active' => [
                'nullable',
                'boolean',
            ],

            'page' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'per_page' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],
        ]);

        $products = Product::query()
            ->with([
                'category',
                'suppliers',
            ])

            /*
        |--------------------------------------------------------------------------
        | Search
        |--------------------------------------------------------------------------
        */

            ->when(
                !empty($validated['search']),
                function ($query) use ($validated) {

                    $search = $validated['search'];

                    $query->where(function ($query) use ($search) {

                        $query
                            ->where(
                                'name',
                                'like',
                                "%{$search}%"
                            )

                            ->orWhere(
                                'sku',
                                'like',
                                "%{$search}%"
                            )

                            ->orWhere(
                                'barcode',
                                'like',
                                "%{$search}%"
                            );
                    });
                }
            )

            /*
        |--------------------------------------------------------------------------
        | Category Filter
        |--------------------------------------------------------------------------
        */

            ->when(
                isset($validated['category_id']),
                function ($query) use ($validated) {

                    $query->where(
                        'category_id',
                        $validated['category_id']
                    );
                }
            )

            /*
        |--------------------------------------------------------------------------
        | Active / Inactive Filter
        |--------------------------------------------------------------------------
        */

            ->when(
                isset($validated['is_active']),
                function ($query) use ($validated) {

                    $query->where(
                        'is_active',
                        $validated['is_active']
                    );
                }
            )

            /*
        |--------------------------------------------------------------------------
        | Latest Products First
        |--------------------------------------------------------------------------
        */

            ->latest()

            /*
        |--------------------------------------------------------------------------
        | Pagination
        |--------------------------------------------------------------------------
        */

            ->paginate(
                $validated['per_page'] ?? 20
            )

            ->withQueryString();

        return response()->json($products);
    }

    public function export(Request $request)
    {
        $validated = $request->validate([
            'search' => [
                'nullable',
                'string',
                'max:255',
            ],

            'category_id' => [
                'nullable',
                'integer',
                'exists:categories,id',
            ],

            'is_active' => [
                'nullable',
                'boolean',
            ],
        ]);

        return Excel::download(
            new ProductsExport(
                search: $validated['search'] ?? null,
                categoryId: $validated['category_id'] ?? null,
                isActive: array_key_exists(
                    'is_active',
                    $validated
                )
                    ? $validated['is_active']
                    : null,
            ),
            'products-' . now()->format('Y-m-d-His') . '.xlsx'
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => [
                'nullable',
                'exists:categories,id',
            ],

            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'sku' => [
                'required',
                'string',
                'max:100',
                'unique:products,sku',
            ],

            'barcode' => [
                'nullable',
                'string',
                'max:100',
                'unique:products,barcode',
            ],

            'description' => [
                'nullable',
                'string',
            ],

            'unit' => [
                'required',
                'string',
                'max:50',
            ],

            'selling_price' => [
                'required',
                'numeric',
                'min:0',
            ],

            'minimum_stock' => [
                'required',
                'numeric',
                'min:0',
            ],

            'is_active' => [
                'sometimes',
                'boolean',
            ],
        ]);

        $product = Product::create($validated);

        return response()->json([
            'message' => 'Product created successfully.',
            'data' => $product->load([
                'category',
                'suppliers',
            ]),
        ], 201);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json([
            'data' => $product->load([
                'category',
                'suppliers',
            ]),
        ]);
    }

    public function update(
        Request $request,
        Product $product
    ): JsonResponse {
        $validated = $request->validate([
            'category_id' => [
                'nullable',
                'exists:categories,id',
            ],

            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],

            'sku' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                'unique:products,sku,' . $product->id,
            ],

            'barcode' => [
                'nullable',
                'string',
                'max:100',
                'unique:products,barcode,' . $product->id,
            ],

            'description' => [
                'nullable',
                'string',
            ],

            'unit' => [
                'sometimes',
                'required',
                'string',
                'max:50',
            ],

            'selling_price' => [
                'sometimes',
                'required',
                'numeric',
                'min:0',
            ],

            'minimum_stock' => [
                'sometimes',
                'required',
                'numeric',
                'min:0',
            ],

            'is_active' => [
                'sometimes',
                'boolean',
            ],
        ]);

        $product->update($validated);

        return response()->json([
            'message' => 'Product updated successfully.',
            'data' => $product->fresh()->load([
                'category',
                'suppliers',
            ]),
        ]);
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->update([
            'is_active' => false,
        ]);

        return response()->json([
            'message' => 'Product deactivated successfully.',
        ]);
    }

    public function syncSuppliers(
        Request $request,
        Product $product
    ): JsonResponse {
        $validated = $request->validate([
            'suppliers' => [
                'required',
                'array',
                'min:1',
            ],

            'suppliers.*.supplier_id' => [
                'required',
                'integer',
                'exists:suppliers,id',
            ],

            'suppliers.*.supplier_sku' => [
                'nullable',
                'string',
                'max:100',
            ],

            'suppliers.*.cost_price' => [
                'required',
                'numeric',
                'min:0',
            ],

            'suppliers.*.is_preferred' => [
                'sometimes',
                'boolean',
            ],
        ]);

        $supplierIds = collect($validated['suppliers'])
            ->pluck('supplier_id');

        if (
            $supplierIds->count() !==
            $supplierIds->unique()->count()
        ) {
            return response()->json([
                'message' => 'Duplicate suppliers are not allowed.',
            ], 422);
        }

        $preferredCount = collect($validated['suppliers'])
            ->where('is_preferred', true)
            ->count();

        if ($preferredCount > 1) {
            return response()->json([
                'message' => 'Only one preferred supplier is allowed per product.',
            ], 422);
        }

        $syncData = [];

        foreach ($validated['suppliers'] as $supplier) {
            $syncData[$supplier['supplier_id']] = [
                'supplier_sku' =>
                $supplier['supplier_sku'] ?? null,

                'cost_price' =>
                $supplier['cost_price'],

                'is_preferred' =>
                $supplier['is_preferred'] ?? false,
            ];
        }

        $product->suppliers()->sync($syncData);

        return response()->json([
            'message' =>
            'Product suppliers updated successfully.',

            'data' =>
            $product->fresh()->load('suppliers'),
        ]);
    }
}
