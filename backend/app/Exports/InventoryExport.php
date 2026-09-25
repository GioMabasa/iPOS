<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Font;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class InventoryExport implements FromCollection, WithHeadings, ShouldAutoSize, WithEvents
{
    protected Collection $data;

    public function __construct(Collection $data)
    {
        $this->data = $data;
    }

    public function collection(): Collection
    {
        return $this->data->map(function (array $product) {
            return [
                $product['name'],
                $product['sku'],
                $product['barcode'],
                $product['supplier'],
                $product['minimum_stock'] ?? 0,
                $product['stock'] ?? 0,
                $product['unit'],
                $product['stock_value'] ?? 0,
                $product['cost'] ?? 0,
                $product['selling_price'] ?? 0,
                $product['stock_status'],
                $product['product_status'],
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Product',
            'SKU',
            'Barcode',
            'Supplier',
            'Minimum Stock',
            'Stock',
            'Unit',
            'Stock Value',
            'Cost',
            'Selling Price',
            'Stock Status',
            'Product Status',
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                /*
                |--------------------------------------------------------------------------
                | Original Table Row
                |--------------------------------------------------------------------------
                */

                $originalHighestRow = $sheet->getHighestRow();

                /*
                |--------------------------------------------------------------------------
                | Summary Calculations
                |--------------------------------------------------------------------------
                */

                $totalProducts = $this->data->count();

                $inStock = $this->data->filter(function (array $product) {
                    return trim((string) ($product['stock_status'] ?? '')) === 'In Stock';
                })->count();

                $lowStock = $this->data->filter(function (array $product) {
                    return trim((string) ($product['stock_status'] ?? '')) === 'Low Stock';
                })->count();

                $outOfStock = $this->data->filter(function (array $product) {
                    return trim((string) ($product['stock_status'] ?? '')) === 'Out of Stock';
                })->count();

                $stockValue = $this->data->sum(function (array $product) {
                    return (float) ($product['stock_value'] ?? 0);
                });

                /*
                |--------------------------------------------------------------------------
                | Supplier Summary
                |--------------------------------------------------------------------------
                */

                $suppliers = $this->data
                    ->map(function (array $product) {
                        return trim((string) ($product['supplier'] ?? ''));
                    })
                    ->filter()
                    ->unique()
                    ->values();

                if ($suppliers->count() === 1) {
                    $supplierLabel = $suppliers->first();
                } else {
                    $supplierLabel = 'All Suppliers';
                }

                /*
                |--------------------------------------------------------------------------
                | Move Detailed Table Down
                |--------------------------------------------------------------------------
                */

                $sheet->insertNewRowBefore(1, 7);

                $highestRow = $originalHighestRow + 7;
                $headerRow = 8;
                $dataStartRow = 9;

                /*
                |--------------------------------------------------------------------------
                | Main Title
                |--------------------------------------------------------------------------
                */

                $sheet->mergeCells('A1:L1');

                $sheet->setCellValue('A1', 'INVENTORY SUMMARY');

                $sheet->getStyle('A1:L1')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 18,
                        'color' => [
                            'argb' => 'FFFFFFFF',
                        ],
                    ],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => [
                            'argb' => 'FF4F46E5',
                        ],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ]);

                $sheet->getRowDimension(1)->setRowHeight(32);

                /*
                |--------------------------------------------------------------------------
                | Supplier Row
                |--------------------------------------------------------------------------
                */

                $sheet->mergeCells('A2:L2');

                $sheet->setCellValue(
                    'A2',
                    'Supplier: ' . $supplierLabel
                );

                $sheet->getStyle('A2:L2')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 11,
                        'color' => [
                            'argb' => 'FF475569',
                        ],
                    ],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => [
                            'argb' => 'FFF1F5F9',
                        ],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ]);

                $sheet->getRowDimension(2)->setRowHeight(22);

                /*
                |--------------------------------------------------------------------------
                | Summary Cards
                |--------------------------------------------------------------------------
                */

                $cards = [
                    [
                        'range' => 'A4:B5',
                        'label' => 'Total Products',
                        'value' => $totalProducts,
                        'fill' => 'FFE0E7FF',
                        'labelColor' => 'FF4338CA',
                        'valueColor' => 'FF312E81',
                    ],
                    [
                        'range' => 'C4:D5',
                        'label' => 'In Stock',
                        'value' => $inStock,
                        'fill' => 'FFDCFCE7',
                        'labelColor' => 'FF15803D',
                        'valueColor' => 'FF166534',
                    ],
                    [
                        'range' => 'E4:F5',
                        'label' => 'Low Stock',
                        'value' => $lowStock,
                        'fill' => 'FFFEF3C7',
                        'labelColor' => 'FFD97706',
                        'valueColor' => 'FF92400E',
                    ],
                    [
                        'range' => 'G4:H5',
                        'label' => 'Out of Stock',
                        'value' => $outOfStock,
                        'fill' => 'FFFEE2E2',
                        'labelColor' => 'FFDC2626',
                        'valueColor' => 'FF991B1B',
                    ],
                    [
                        'range' => 'I4:L5',
                        'label' => 'Stock Value',
                        'value' => $stockValue,
                        'fill' => 'FFDBEAFE',
                        'labelColor' => 'FF2563EB',
                        'valueColor' => 'FF1E3A8A',
                    ],
                ];

                foreach ($cards as $card) {
                    $range = $card['range'];

                    $sheet->mergeCells($range);

                    [$startCell] = explode(':', $range);

                    $sheet->setCellValue(
                        $startCell,
                        $card['label'] . "\n" . (
                            $card['label'] === 'Stock Value'
                            ? number_format((float) $card['value'], 2)
                            : number_format((int) $card['value'])
                        )
                    );

                    $sheet->getStyle($range)->applyFromArray([
                        'font' => [
                            'bold' => true,
                            'size' => 11,
                            'color' => [
                                'argb' => $card['labelColor'],
                            ],
                        ],
                        'fill' => [
                            'fillType' => Fill::FILL_SOLID,
                            'startColor' => [
                                'argb' => $card['fill'],
                            ],
                        ],
                        'alignment' => [
                            'horizontal' => Alignment::HORIZONTAL_CENTER,
                            'vertical' => Alignment::VERTICAL_CENTER,
                            'wrapText' => true,
                        ],
                        'borders' => [
                            'outline' => [
                                'borderStyle' => Border::BORDER_THIN,
                                'color' => [
                                    'argb' => 'FFE2E8F0',
                                ],
                            ],
                        ],
                    ]);

                    $sheet->getStyle($startCell)->getFont()
                        ->setBold(true)
                        ->setSize(12)
                        ->getColor()
                        ->setARGB($card['valueColor']);
                }

                $sheet->getRowDimension(4)->setRowHeight(25);
                $sheet->getRowDimension(5)->setRowHeight(25);

                /*
                |--------------------------------------------------------------------------
                | Inventory Details Section
                |--------------------------------------------------------------------------
                */

                $sheet->mergeCells('A7:L7');

                $sheet->setCellValue('A7', 'INVENTORY DETAILS');

                $sheet->getStyle('A7:L7')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 11,
                        'color' => [
                            'argb' => 'FFFFFFFF',
                        ],
                    ],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => [
                            'argb' => 'FF4338CA',
                        ],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_LEFT,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ]);

                $sheet->getRowDimension(7)->setRowHeight(24);

                /*
                |--------------------------------------------------------------------------
                | Table Header
                |--------------------------------------------------------------------------
                */

                $sheet->getStyle("A{$headerRow}:L{$headerRow}")->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'color' => [
                            'argb' => 'FFFFFFFF',
                        ],
                        'size' => 10,
                    ],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => [
                            'argb' => 'FF4F46E5',
                        ],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical' => Alignment::VERTICAL_CENTER,
                        'wrapText' => true,
                    ],
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => [
                                'argb' => 'FFD1D5DB',
                            ],
                        ],
                    ],
                ]);

                $sheet->getRowDimension($headerRow)->setRowHeight(28);

                /*
                |--------------------------------------------------------------------------
                | Barcode as Text
                |--------------------------------------------------------------------------
                */

                for ($row = $dataStartRow; $row <= $highestRow; $row++) {
                    $barcode = $sheet->getCell("C{$row}")->getValue();

                    if ($barcode !== null && $barcode !== '') {
                        $sheet->setCellValueExplicit(
                            "C{$row}",
                            (string) $barcode,
                            DataType::TYPE_STRING
                        );
                    }
                }

                /*
                |--------------------------------------------------------------------------
                | Make Zero Values Visible
                |--------------------------------------------------------------------------
                */

                for ($row = $dataStartRow; $row <= $highestRow; $row++) {
                    // Stock
                    if (
                        $sheet->getCell("F{$row}")->getValue() === null ||
                        $sheet->getCell("F{$row}")->getValue() === ''
                    ) {
                        $sheet->setCellValueExplicit(
                            "F{$row}",
                            '0',
                            DataType::TYPE_NUMERIC
                        );
                    }

                    // Stock Value
                    if (
                        $sheet->getCell("H{$row}")->getValue() === null ||
                        $sheet->getCell("H{$row}")->getValue() === ''
                    ) {
                        $sheet->setCellValueExplicit(
                            "H{$row}",
                            '0',
                            DataType::TYPE_NUMERIC
                        );
                    }

                    // Cost
                    if (
                        $sheet->getCell("I{$row}")->getValue() === null ||
                        $sheet->getCell("I{$row}")->getValue() === ''
                    ) {
                        $sheet->setCellValueExplicit(
                            "I{$row}",
                            '0',
                            DataType::TYPE_NUMERIC
                        );
                    }
                }

                /*
                |--------------------------------------------------------------------------
                | Currency Formatting
                |--------------------------------------------------------------------------
                */

                if ($highestRow >= $dataStartRow) {
                    $sheet->getStyle("H{$dataStartRow}:J{$highestRow}")
                        ->getNumberFormat()
                        ->setFormatCode('#,##0.00');

                    $sheet->getStyle("E{$dataStartRow}:F{$highestRow}")
                        ->getNumberFormat()
                        ->setFormatCode('#,##0');
                }

                /*
                |--------------------------------------------------------------------------
                | Stock Status Colors
                |--------------------------------------------------------------------------
                */

                for ($row = $dataStartRow; $row <= $highestRow; $row++) {
                    $stockStatus = trim(
                        (string) $sheet->getCell("K{$row}")->getValue()
                    );

                    if ($stockStatus === 'In Stock') {
                        $sheet->getStyle("K{$row}")
                            ->getFill()
                            ->setFillType(Fill::FILL_SOLID)
                            ->getStartColor()
                            ->setARGB('FFDCFCE7');

                        $sheet->getStyle("K{$row}")
                            ->getFont()
                            ->setBold(true)
                            ->getColor()
                            ->setARGB('FF15803D');
                    } elseif ($stockStatus === 'Low Stock') {
                        $sheet->getStyle("K{$row}")
                            ->getFill()
                            ->setFillType(Fill::FILL_SOLID)
                            ->getStartColor()
                            ->setARGB('FFFEF3C7');

                        $sheet->getStyle("K{$row}")
                            ->getFont()
                            ->setBold(true)
                            ->getColor()
                            ->setARGB('FFD97706');
                    } elseif ($stockStatus === 'Out of Stock') {
                        $sheet->getStyle("K{$row}")
                            ->getFill()
                            ->setFillType(Fill::FILL_SOLID)
                            ->getStartColor()
                            ->setARGB('FFFEE2E2');

                        $sheet->getStyle("K{$row}")
                            ->getFont()
                            ->setBold(true)
                            ->getColor()
                            ->setARGB('FFDC2626');
                    }
                }

                /*
                |--------------------------------------------------------------------------
                | Product Status Colors
                |--------------------------------------------------------------------------
                */

                for ($row = $dataStartRow; $row <= $highestRow; $row++) {
                    $productStatus = trim(
                        (string) $sheet->getCell("L{$row}")->getValue()
                    );

                    if ($productStatus === 'Active') {
                        $sheet->getStyle("L{$row}")
                            ->getFill()
                            ->setFillType(Fill::FILL_SOLID)
                            ->getStartColor()
                            ->setARGB('FFDCFCE7');

                        $sheet->getStyle("L{$row}")
                            ->getFont()
                            ->setBold(true)
                            ->getColor()
                            ->setARGB('FF15803D');
                    } elseif ($productStatus === 'Inactive') {
                        $sheet->getStyle("L{$row}")
                            ->getFill()
                            ->setFillType(Fill::FILL_SOLID)
                            ->getStartColor()
                            ->setARGB('FFFEE2E2');

                        $sheet->getStyle("L{$row}")
                            ->getFont()
                            ->setBold(true)
                            ->getColor()
                            ->setARGB('FFB91C1C');
                    }
                }

                /*
                |--------------------------------------------------------------------------
                | Body Formatting
                |--------------------------------------------------------------------------
                */

                if ($highestRow >= $dataStartRow) {
                    $sheet->getStyle("A{$dataStartRow}:L{$highestRow}")
                        ->applyFromArray([
                            'borders' => [
                                'bottom' => [
                                    'borderStyle' => Border::BORDER_HAIR,
                                    'color' => [
                                        'argb' => 'FFE2E8F0',
                                    ],
                                ],
                            ],
                            'alignment' => [
                                'vertical' => Alignment::VERTICAL_CENTER,
                            ],
                        ]);

                    $sheet->getStyle("A{$dataStartRow}:D{$highestRow}")
                        ->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_LEFT);

                    $sheet->getStyle("E{$dataStartRow}:J{$highestRow}")
                        ->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_RIGHT);

                    $sheet->getStyle("K{$dataStartRow}:L{$highestRow}")
                        ->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_CENTER);
                }

                /*
                |--------------------------------------------------------------------------
                | Column Widths
                |--------------------------------------------------------------------------
                */

                $widths = [
                    'A' => 32,
                    'B' => 20,
                    'C' => 24,
                    'D' => 28,
                    'E' => 17,
                    'F' => 14,
                    'G' => 14,
                    'H' => 18,
                    'I' => 16,
                    'J' => 18,
                    'K' => 18,
                    'L' => 18,
                ];

                foreach ($widths as $column => $width) {
                    $sheet->getColumnDimension($column)
                        ->setWidth($width);
                }

                /*
                |--------------------------------------------------------------------------
                | Freeze Panes
                |--------------------------------------------------------------------------
                */

                $sheet->freezePane('A9');

                /*
                |--------------------------------------------------------------------------
                | Auto Filter
                |--------------------------------------------------------------------------
                */

                if ($highestRow >= $headerRow) {
                    $sheet->setAutoFilter(
                        "A{$headerRow}:L{$highestRow}"
                    );
                }

                /*
                |--------------------------------------------------------------------------
                | Tab Color
                |--------------------------------------------------------------------------
                */

                $sheet->getTabColor()->setRGB('4F46E5');

                /*
                |--------------------------------------------------------------------------
                | Print / View
                |--------------------------------------------------------------------------
                */

                $sheet->setShowGridlines(false);

                $sheet->getPageSetup()
                    ->setOrientation(
                        \PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::ORIENTATION_LANDSCAPE
                    );

                $sheet->getPageSetup()
                    ->setFitToWidth(1);

                $sheet->getPageSetup()
                    ->setFitToHeight(0);

                /*
                |--------------------------------------------------------------------------
                | Row Heights
                |--------------------------------------------------------------------------
                */

                for ($row = $dataStartRow; $row <= $highestRow; $row++) {
                    $sheet->getRowDimension($row)->setRowHeight(22);
                }
            },
        ];
    }
}
