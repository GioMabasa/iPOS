<?php

namespace App\Exports;

use App\Models\Product;
use App\Services\InventoryService;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class ProductsExport implements FromCollection, WithHeadings, WithStyles, ShouldAutoSize
{
    protected InventoryService $inventoryService;

    public function __construct(
        protected ?string $search = null,
        protected ?int $categoryId = null,
        protected mixed $isActive = null
    ) {
        $this->inventoryService = app(InventoryService::class);
    }

    public function collection(): Collection
    {
        $products = Product::query()
            ->with('category')
            ->when(
                !empty($this->search),
                function ($query) {
                    $search = $this->search;

                    $query->where(function ($query) use ($search) {
                        $query
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('sku', 'like', "%{$search}%")
                            ->orWhere('barcode', 'like', "%{$search}%");
                    });
                }
            )
            ->when(
                $this->categoryId !== null,
                function ($query) {
                    $query->where('category_id', $this->categoryId);
                }
            )
            ->when(
                $this->isActive !== null,
                function ($query) {
                    $query->where('is_active', $this->isActive);
                }
            )
            ->latest()
            ->get();

        return $products->map(function (Product $product): array {
            return [
                $product->name,
                $product->sku,
                $product->barcode ? "\t" . $product->barcode : '-',
                $product->category?->name ?: '-',
                $product->unit,
                (float) $product->selling_price,
                $this->inventoryService->getCurrentStock($product),
                (float) $product->minimum_stock,
                $product->is_active ? 'Active' : 'Inactive',
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Product',
            'SKU',
            'Barcode',
            'Category',
            'Unit',
            'Selling Price',
            'Stock',
            'Min. Stock',
            'Status',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        $styles = [];

        $highestRow = $sheet->getHighestRow();

        for ($row = 2; $row <= $highestRow; $row++) {
            $statusCell = $sheet->getCell("I{$row}");

            if ($statusCell->getValue() === 'Active') {
                $styles["I{$row}"] = [
                    'font' => [
                        'color' => [
                            'argb' => '008000',
                        ],
                    ],
                ];
            }

            if ($statusCell->getValue() === 'Inactive') {
                $styles["I{$row}"] = [
                    'font' => [
                        'color' => [
                            'argb' => 'FF0000',
                        ],
                    ],
                ];
            }
        }

        return $styles;
    }
}
