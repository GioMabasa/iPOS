<?php

namespace App\Exports;

use App\Models\Product;
use App\Services\InventoryService;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ProductsExport implements
    FromCollection,
    WithHeadings,
    WithStyles,
    WithEvents,
    WithColumnWidths
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
        return [
            1 => [
                'font' => [
                    'bold' => true,
                    'color' => [
                        'rgb' => 'FFFFFF',
                    ],
                ],
                'fill' => [
                    'fillType' => 'solid',
                    'color' => [
                        'rgb' => '4F46E5',
                    ],
                ],
                'alignment' => [
                    'horizontal' => 'center',
                    'vertical' => 'center',
                ],
            ],
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 32,
            'B' => 20,
            'C' => 24,
            'D' => 24,
            'E' => 14,
            'F' => 18,
            'G' => 14,
            'H' => 16,
            'I' => 16,
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {

                $sheet = $event->sheet->getDelegate();

                $highestRow = $sheet->getHighestRow();

                /*
                 * Worksheet presentation.
                 */
                $sheet->getTabColor('4F46E5');

                /*
                 * Header.
                 */
                $sheet->getStyle('A1:I1')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 11,
                        'color' => [
                            'rgb' => 'FFFFFF',
                        ],
                    ],
                    'fill' => [
                        'fillType' => 'solid',
                        'color' => [
                            'rgb' => '4338CA',
                        ],
                    ],
                    'alignment' => [
                        'horizontal' => 'center',
                        'vertical' => 'center',
                        'wrapText' => true,
                    ],
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => 'thin',
                            'color' => [
                                'rgb' => 'CBD5E1',
                            ],
                        ],
                    ],
                ]);

                $sheet->getRowDimension(1)->setRowHeight(30);

                /*
                 * Data rows.
                 */
                if ($highestRow >= 2) {

                    $sheet->getStyle(
                        "A2:I{$highestRow}"
                    )->applyFromArray([
                        'borders' => [
                            'allBorders' => [
                                'borderStyle' => 'thin',
                                'color' => [
                                    'rgb' => 'E2E8F0',
                                ],
                            ],
                        ],
                        'alignment' => [
                            'vertical' => 'center',
                        ],
                    ]);

                    /*
                     * Currency.
                     */
                    $sheet->getStyle(
                        "F2:F{$highestRow}"
                    )->getNumberFormat()
                        ->setFormatCode(
                            '#,##0.00'
                        );

                    /*
                     * Stock and minimum stock.
                     */
                    $sheet->getStyle(
                        "G2:H{$highestRow}"
                    )->getNumberFormat()
                        ->setFormatCode(
                            '#,##0'
                        );

                    /*
                     * Barcode.
                     *
                     * Keep barcode as text so Excel does not
                     * convert long barcode values to scientific notation.
                     */
                    $sheet->getStyle(
                        "C2:C{$highestRow}"
                    )->getNumberFormat()
                        ->setFormatCode('@');

                    /*
                     * Alignment.
                     */
                    $sheet->getStyle(
                        "B2:C{$highestRow}"
                    )->getAlignment()
                        ->setHorizontal('left');

                    $sheet->getStyle(
                        "F2:H{$highestRow}"
                    )->getAlignment()
                        ->setHorizontal('right');

                    $sheet->getStyle(
                        "E2:E{$highestRow}"
                    )->getAlignment()
                        ->setHorizontal('center');

                    $sheet->getStyle(
                        "I2:I{$highestRow}"
                    )->getAlignment()
                        ->setHorizontal('center');

                    /*
                     * Status styling.
                     */
                    for ($row = 2; $row <= $highestRow; $row++) {

                        $status =
                            strtolower(
                                (string) $sheet
                                    ->getCell("I{$row}")
                                    ->getValue()
                            );

                        if ($status === 'active') {

                            $sheet->getStyle(
                                "I{$row}"
                            )->applyFromArray([
                                'font' => [
                                    'bold' => true,
                                    'color' => [
                                        'rgb' => '15803D',
                                    ],
                                ],
                                'fill' => [
                                    'fillType' => 'solid',
                                    'color' => [
                                        'rgb' => 'DCFCE7',
                                    ],
                                ],
                                'alignment' => [
                                    'horizontal' => 'center',
                                    'vertical' => 'center',
                                ],
                            ]);
                        }

                        if ($status === 'inactive') {

                            $sheet->getStyle(
                                "I{$row}"
                            )->applyFromArray([
                                'font' => [
                                    'bold' => true,
                                    'color' => [
                                        'rgb' => 'B91C1C',
                                    ],
                                ],
                                'fill' => [
                                    'fillType' => 'solid',
                                    'color' => [
                                        'rgb' => 'FEE2E2',
                                    ],
                                ],
                                'alignment' => [
                                    'horizontal' => 'center',
                                    'vertical' => 'center',
                                ],
                            ]);
                        }
                    }
                }

                /*
                 * Freeze header.
                 */
                $sheet->freezePane('A2');

                /*
                 * Auto filter.
                 */
                if ($highestRow >= 1) {
                    $sheet->setAutoFilter(
                        "A1:I{$highestRow}"
                    );
                }
            },
        ];
    }
}
