<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Style\Fill;

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

                $highestRow = $sheet->getHighestRow();
                $highestColumn = $sheet->getHighestColumn();

                // Make the header bold
                $sheet->getStyle("A1:{$highestColumn}1")
                    ->getFont()
                    ->setBold(true);

                /*
                |--------------------------------------------------------------------------
                | Barcode as Text
                |--------------------------------------------------------------------------
                */

                for ($row = 2; $row <= $highestRow; $row++) {
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

                for ($row = 2; $row <= $highestRow; $row++) {
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
                | Stock Status Colors
                |--------------------------------------------------------------------------
                */

                for ($row = 2; $row <= $highestRow; $row++) {
                    $stockStatus = trim(
                        (string) $sheet->getCell("K{$row}")->getValue()
                    );

                    if ($stockStatus === 'Low Stock') {
                        $sheet->getStyle("K{$row}")
                            ->getFill()
                            ->setFillType(Fill::FILL_SOLID)
                            ->getStartColor()
                            ->setARGB('FFFFF2CC');
                    } elseif ($stockStatus === 'Out of Stock') {
                        $sheet->getStyle("K{$row}")
                            ->getFill()
                            ->setFillType(Fill::FILL_SOLID)
                            ->getStartColor()
                            ->setARGB('FFF4CCCC');
                    }
                }
            },
        ];
    }
}
